import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AppStateRepositoryModule =
    typeof import("../../src/features/app-state/app-state-repository.ts");

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
    repository: AppStateRepositoryModule;
    projectId: string;
};

async function ensureProjectAndAppStateTables(
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
        CREATE TABLE IF NOT EXISTS "AppState" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "projectId" TEXT NOT NULL,
            "section" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedBy" TEXT,
            CONSTRAINT "AppState_projectId_fkey"
                FOREIGN KEY ("projectId")
                REFERENCES "Project" ("id")
                ON DELETE CASCADE ON UPDATE CASCADE
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "AppState_projectId_section_key"
        ON "AppState" ("projectId", "section")
    `);
}

describe.sequential("integration/app-state-repository", () => {
    let state: IntegrationState | null = null;

    beforeEach(async () => {
        vi.resetModules();

        const dbDir = await mkdtemp(path.join(os.tmpdir(), "codelore-mcp-db-"));
        const dbPath = path.join(dbDir, `${randomUUID()}.sqlite`);
        process.env.DATABASE_URL = `file:${dbPath}`;

        const { prisma } = await import("@codelore/database");
        await ensureProjectAndAppStateTables(
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
            await import("../../src/features/app-state/app-state-repository.ts");

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

    it("upserts app state and can fetch it by section", async () => {
        const upserted = await state!.repository.upsertAppState(
            state!.projectId,
            "session-1",
            {
                section: "architecture",
                content: "Initial architecture",
            },
        );

        const found = await state!.repository.findAppStateBySection(
            state!.projectId,
            "architecture",
        );

        expect(upserted.projectId).toBe(state!.projectId);
        expect(upserted.section).toBe("architecture");
        expect(upserted.content).toBe("Initial architecture");
        expect(upserted.updatedBy).toBe("session-1");

        expect(found).not.toBeNull();
        expect(found!.id).toBe(upserted.id);
    });

    it("updates existing section instead of creating duplicates", async () => {
        const first = await state!.repository.upsertAppState(
            state!.projectId,
            "session-1",
            {
                section: "database",
                content: "v1",
            },
        );

        const second = await state!.repository.upsertAppState(
            state!.projectId,
            "session-2",
            {
                section: "database",
                content: "v2",
            },
        );

        const list = await state!.repository.listAppStates(state!.projectId);

        expect(second.id).toBe(first.id);
        expect(second.content).toBe("v2");
        expect(second.updatedBy).toBe("session-2");
        expect(list).toHaveLength(1);
    });

    it("lists sections sorted by section name", async () => {
        await state!.repository.upsertAppState(state!.projectId, "session-1", {
            section: "tech_stack",
            content: "TypeScript",
        });

        await state!.repository.upsertAppState(state!.projectId, "session-1", {
            section: "architecture",
            content: "Service boundaries",
        });

        const list = await state!.repository.listAppStates(state!.projectId);

        expect(list.map((entry) => entry.section)).toEqual([
            "architecture",
            "tech_stack",
        ]);
    });

    it("returns null for a missing section", async () => {
        const found = await state!.repository.findAppStateBySection(
            state!.projectId,
            "missing",
        );

        expect(found).toBeNull();
    });
});
