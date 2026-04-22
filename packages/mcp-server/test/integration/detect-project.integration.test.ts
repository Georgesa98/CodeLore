import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type DetectProjectModule =
    typeof import("../../src/features/project-detection/detect-project.ts");
type RepositoryModule =
    typeof import("../../src/features/project-detection/project-repository.ts");

type IntegrationState = {
    dbDir: string;
    prisma: {
        $disconnect: () => Promise<void>;
        $executeRawUnsafe: (query: string) => Promise<unknown>;
    };
    detectProjectModule: DetectProjectModule;
    repository: RepositoryModule;
    detectRepoRootMock: ReturnType<typeof vi.fn>;
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

describe.sequential("integration/detect_project", () => {
    let state: IntegrationState | null = null;

    beforeEach(async () => {
        vi.resetModules();

        const dbDir = await mkdtemp(path.join(os.tmpdir(), "codelore-mcp-db-"));
        const dbPath = path.join(dbDir, `${randomUUID()}.sqlite`);
        process.env.DATABASE_URL = `file:${dbPath}`;

        const detectRepoRootMock = vi.fn();

        vi.doMock("../../src/features/project-detection/git-utils.ts", () => ({
            detectRepoRoot: detectRepoRootMock,
        }));

        const { prisma } = await import("@codelore/database");
        await ensureProjectTable(
            prisma as unknown as IntegrationState["prisma"],
        );

        const repository =
            await import("../../src/features/project-detection/project-repository.ts");

        const detectProjectModule =
            await import("../../src/features/project-detection/detect-project.ts");

        state = {
            dbDir,
            prisma: prisma as unknown as IntegrationState["prisma"],
            repository,
            detectProjectModule,
            detectRepoRootMock,
        };
    });

    afterEach(async () => {
        if (state) {
            await state.prisma.$disconnect();
            await rm(state.dbDir, { recursive: true, force: true });
            state = null;
        }

        vi.doUnmock("../../src/features/project-detection/git-utils.ts");
    });

    it("returns existing project payload when repo is already tracked", async () => {
        await state!.repository.createProject({
            name: "Existing",
            repoPath: "/tmp/existing-repo",
        });

        state!.detectRepoRootMock.mockResolvedValue("/tmp/existing-repo");

        const result = await state!.detectProjectModule.detect_project({
            cwd: "/tmp/existing-repo",
        });

        expect(result).toMatchObject({
            structuredContent: {
                name: "Existing",
                repoPath: "/tmp/existing-repo",
                isNew: false,
            },
        });
    });

    it("creates and returns a new project payload when repo is not tracked", async () => {
        state!.detectRepoRootMock.mockResolvedValue("/tmp/new-repo");

        const result = await state!.detectProjectModule.detect_project({
            cwd: "/tmp/new-repo",
        });

        expect(result).toMatchObject({
            structuredContent: {
                name: "new-repo",
                repoPath: "/tmp/new-repo",
                isNew: true,
            },
        });

        const found =
            await state!.repository.findProjectByRepoPath("/tmp/new-repo");
        expect(found).not.toBeNull();
    });

    it("returns validation error result for invalid cwd", async () => {
        const result = await state!.detectProjectModule.detect_project({
            cwd: "   ",
        });

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "cwd is required" }],
        });

        expect(state!.detectRepoRootMock).not.toHaveBeenCalled();
    });

    it("returns tool error result when repo root detection fails", async () => {
        state!.detectRepoRootMock.mockRejectedValue(new Error("git failure"));

        const result = await state!.detectProjectModule.detect_project({
            cwd: "/tmp/repo",
        });

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "git failure" }],
        });
    });
});
