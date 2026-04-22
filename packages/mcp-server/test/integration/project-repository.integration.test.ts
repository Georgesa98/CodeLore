import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RepositoryModule =
    typeof import("../../src/features/project-detection/project-repository.ts");

type IntegrationState = {
    dbDir: string;
    prisma: {
        $disconnect: () => Promise<void>;
        $executeRawUnsafe: (query: string) => Promise<unknown>;
    };
    repository: RepositoryModule;
};

async function ensureProjectTable(prisma: IntegrationState["prisma"]) {
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
}

describe.sequential("integration/project-repository", () => {
    let state: IntegrationState | null = null;

    beforeEach(async () => {
        vi.resetModules();

        const dbDir = await mkdtemp(path.join(os.tmpdir(), "codelore-mcp-db-"));
        const dbPath = path.join(dbDir, `${randomUUID()}.sqlite`);
        process.env.DATABASE_URL = `file:${dbPath}`;

        const { prisma } = await import("@codelore/database");
        await ensureProjectTable(
            prisma as unknown as IntegrationState["prisma"],
        );

        const repository =
            await import("../../src/features/project-detection/project-repository.ts");

        state = {
            dbDir,
            prisma: prisma as unknown as IntegrationState["prisma"],
            repository,
        };
    });

    afterEach(async () => {
        if (state) {
            await state.prisma.$disconnect();
            await rm(state.dbDir, { recursive: true, force: true });
            state = null;
        }
    });

    it("creates a project and fetches it by repoPath", async () => {
        const created = await state!.repository.createProject({
            name: "CodeLore",
            repoPath: "/tmp/codelore",
        });

        const found =
            await state!.repository.findProjectByRepoPath("/tmp/codelore");

        expect(created.id).toBeTruthy();
        expect(created.name).toBe("CodeLore");
        expect(created.repoPath).toBe("/tmp/codelore");

        expect(found).toEqual({
            id: created.id,
            name: "CodeLore",
            repoPath: "/tmp/codelore",
        });
    });

    it("returns null when repoPath does not exist", async () => {
        const found =
            await state!.repository.findProjectByRepoPath("/tmp/missing");

        expect(found).toBeNull();
    });

    it("upserts by repoPath and keeps existing row unchanged", async () => {
        const first = await state!.repository.createProject({
            name: "Original",
            repoPath: "/tmp/unique-repo",
        });

        const second = await state!.repository.createProject({
            name: "Changed",
            repoPath: "/tmp/unique-repo",
        });

        expect(second.id).toBe(first.id);
        expect(second.name).toBe("Original");
        expect(second.repoPath).toBe("/tmp/unique-repo");
    });
});
