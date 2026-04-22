import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectDetectionError } from "../../src/shared/errors.ts";

const { existsSyncMock, checkIsRepoMock, revparseMock, simpleGitMock } =
    vi.hoisted(() => {
        const checkIsRepoMock = vi.fn();
        const revparseMock = vi.fn();

        return {
            existsSyncMock: vi.fn(),
            checkIsRepoMock,
            revparseMock,
            simpleGitMock: vi.fn(() => ({
                checkIsRepo: checkIsRepoMock,
                revparse: revparseMock,
            })),
        };
    });

vi.mock("node:fs", () => ({
    existsSync: existsSyncMock,
}));

vi.mock("simple-git", () => ({
    simpleGit: simpleGitMock,
}));

import { detectRepoRoot } from "../../src/features/project-detection/git-utils.ts";

describe("features/project-detection/git-utils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        checkIsRepoMock.mockResolvedValue(true);
        revparseMock.mockResolvedValue("/tmp/repo\n");
    });

    it("returns repo root when .git marker exists in cwd", async () => {
        existsSyncMock.mockImplementation(
            (markerPath: string) =>
                markerPath === path.join("/tmp/repo", ".git"),
        );

        const root = await detectRepoRoot("/tmp/repo");

        expect(root).toBe("/tmp/repo");
        expect(simpleGitMock).toHaveBeenCalledWith({ baseDir: "/tmp/repo" });
        expect(checkIsRepoMock).toHaveBeenCalledTimes(1);
        expect(revparseMock).toHaveBeenCalledWith(["--show-toplevel"]);
    });

    it("walks up to find the nearest .git boundary", async () => {
        existsSyncMock.mockImplementation(
            (markerPath: string) =>
                markerPath === path.join("/tmp/repo", ".git"),
        );

        const root = await detectRepoRoot("/tmp/repo/sub/dir");

        expect(root).toBe("/tmp/repo");
        expect(simpleGitMock).toHaveBeenCalledWith({ baseDir: "/tmp/repo" });
    });

    it("throws when no git marker is found while walking up", async () => {
        existsSyncMock.mockReturnValue(false);

        await expect(detectRepoRoot("/tmp/no-repo/deep/path")).rejects.toThrow(
            ProjectDetectionError,
        );

        expect(simpleGitMock).not.toHaveBeenCalled();
    });

    it("throws when boundary exists but repository is invalid", async () => {
        existsSyncMock.mockReturnValue(true);
        checkIsRepoMock.mockResolvedValue(false);

        await expect(detectRepoRoot("/tmp/repo")).rejects.toThrow(
            "Path exists but is not a valid git repository: /tmp/repo",
        );

        expect(revparseMock).not.toHaveBeenCalled();
    });
});
