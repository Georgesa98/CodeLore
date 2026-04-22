import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SessionRepositoryModule =
    typeof import("../../src/features/session-management/session-repository.ts");

type IntegrationState = {
    dbDir: string;
    prisma: {
        $disconnect: () => Promise<void>;
        $executeRawUnsafe: (query: string) => Promise<unknown>;
        project: {
            create: (args: {
                data: {
                    name: string;
                    repoPath: string;
                };
            }) => Promise<{ id: string; name: string; repoPath: string }>;
        };
    };
    repository: SessionRepositoryModule;
    projectId: string;
};

async function ensureProjectAndSessionTables(
    prisma: IntegrationState["prisma"],
) {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Project" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "repoPath" TEXT NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Project_repoPath_key"
        ON "Project" ("repoPath")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Session" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "projectId" TEXT NOT NULL,
            "title" TEXT,
            "agentName" TEXT,
            "status" TEXT NOT NULL DEFAULT 'active',
            "summary" TEXT,
            "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "endedAt" DATETIME,
            CONSTRAINT "Session_projectId_fkey"
                FOREIGN KEY ("projectId")
                REFERENCES "Project" ("id")
                ON DELETE CASCADE ON UPDATE CASCADE
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Session_projectId_idx"
        ON "Session" ("projectId")
    `);
}

describe.sequential("integration/session-repository", () => {
    let state: IntegrationState | null = null;

    beforeEach(async () => {
        vi.resetModules();

        const dbDir = await mkdtemp(path.join(os.tmpdir(), "codelore-mcp-db-"));
        const dbPath = path.join(dbDir, `${randomUUID()}.sqlite`);
        process.env.DATABASE_URL = `file:${dbPath}`;

        const { prisma } = await import("@codelore/database");
        await ensureProjectAndSessionTables(
            prisma as unknown as IntegrationState["prisma"],
        );

        const project = await (
            prisma as unknown as IntegrationState["prisma"]
        ).project.create({
            data: {
                name: "CodeLore",
                repoPath: "/tmp/codelore",
            },
        });

        const repository =
            await import("../../src/features/session-management/session-repository.ts");

        state = {
            dbDir,
            prisma: prisma as unknown as IntegrationState["prisma"],
            repository,
            projectId: project.id,
        };
    });

    afterEach(async () => {
        if (state) {
            await state.prisma.$disconnect();
            await rm(state.dbDir, { recursive: true, force: true });
            state = null;
        }
    });

    it("starts a session and finds it as the open session", async () => {
        const created = await state!.repository.startSession(state!.projectId, {
            title: "Session A",
            agentName: "copilot",
        });

        const found = await state!.repository.findOpenSession(state!.projectId);

        expect(created.projectId).toBe(state!.projectId);
        expect(created.title).toBe("Session A");
        expect(created.agentName).toBe("copilot");
        expect(created.status).toBe("active");
        expect(created.endedAt).toBeNull();

        expect(found).not.toBeNull();
        expect(found!.id).toBe(created.id);
    });

    it("returns the most recently started active session", async () => {
        const first = await state!.repository.startSession(state!.projectId, {
            title: "First",
            agentName: "copilot",
        });

        await state!.repository.endSession(first.id, "Done");

        const second = await state!.repository.startSession(state!.projectId, {
            title: "Second",
            agentName: "copilot",
        });

        const found = await state!.repository.findOpenSession(state!.projectId);

        expect(found).not.toBeNull();
        expect(found!.id).toBe(second.id);
        expect(found!.status).toBe("active");
    });

    it("ends a session and persists summary and completion state", async () => {
        const created = await state!.repository.startSession(state!.projectId, {
            title: "Wrap up",
            agentName: "copilot",
        });

        const ended = await state!.repository.endSession(
            created.id,
            "All done",
        );

        expect(ended.id).toBe(created.id);
        expect(ended.status).toBe("completed");
        expect(ended.summary).toBe("All done");
        expect(ended.endedAt).not.toBeNull();
    });

    it("closes all active sessions for the project and returns count", async () => {
        await state!.repository.startSession(state!.projectId, {
            title: "A",
            agentName: "copilot",
        });

        await state!.repository.startSession(state!.projectId, {
            title: "B",
            agentName: "copilot",
        });

        const count = await state!.repository.closeStaleSessions(
            state!.projectId,
        );
        const openSession = await state!.repository.findOpenSession(
            state!.projectId,
        );

        expect(count).toBe(2);
        expect(openSession).toBeNull();
    });
});
