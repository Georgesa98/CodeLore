import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    parseDetectProjectInputMock,
    detectRepoRootMock,
    findProjectByRepoPathMock,
    createProjectMock,
    getProjectNameFromRepoPathMock,
} = vi.hoisted(() => ({
    parseDetectProjectInputMock: vi.fn(),
    detectRepoRootMock: vi.fn(),
    findProjectByRepoPathMock: vi.fn(),
    createProjectMock: vi.fn(),
    getProjectNameFromRepoPathMock: vi.fn(),
}));

vi.mock("../../src/shared/validation.ts", () => ({
    parseDetectProjectInput: parseDetectProjectInputMock,
}));

vi.mock("../../src/features/project-detection/git-utils.ts", () => ({
    detectRepoRoot: detectRepoRootMock,
}));

vi.mock("../../src/features/project-detection/project-repository.ts", () => ({
    findProjectByRepoPath: findProjectByRepoPathMock,
    createProject: createProjectMock,
}));

vi.mock("../../src/utils/path-resolver.ts", () => ({
    getProjectNameFromRepoPath: getProjectNameFromRepoPathMock,
}));

import {
    detect_project,
    detectProjectInputShape,
    detectProjectOutputShape,
} from "../../src/features/project-detection/detect-project.ts";

describe("features/project-detection/detect_project", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        parseDetectProjectInputMock.mockReturnValue({ cwd: "/tmp/work" });
        detectRepoRootMock.mockResolvedValue("/tmp/repo");
        getProjectNameFromRepoPathMock.mockReturnValue("repo");
        findProjectByRepoPathMock.mockResolvedValue(null);
        createProjectMock.mockResolvedValue({
            id: "project-2",
            name: "repo",
            repoPath: "/tmp/repo",
        });
    });

    it("exports tool shape constants", () => {
        expect(detectProjectInputShape).toEqual({ cwd: "string" });
        expect(detectProjectOutputShape).toEqual({
            projectId: "string",
            name: "string",
            repoPath: "string",
            isNew: "boolean",
        });
    });

    it("returns an existing project when one is found", async () => {
        findProjectByRepoPathMock.mockResolvedValue({
            id: "project-1",
            name: "existing",
            repoPath: "/tmp/repo",
        });

        const result = await detect_project({ cwd: "/any" });

        expect(result).toEqual({
            structuredContent: {
                projectId: "project-1",
                name: "existing",
                repoPath: "/tmp/repo",
                isNew: false,
            },
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            projectId: "project-1",
                            name: "existing",
                            repoPath: "/tmp/repo",
                            isNew: false,
                        },
                        null,
                        2,
                    ),
                },
            ],
        });

        expect(createProjectMock).not.toHaveBeenCalled();
    });

    it("creates and returns a new project when not found", async () => {
        const result = await detect_project({ cwd: "/any" });

        expect(getProjectNameFromRepoPathMock).toHaveBeenCalledWith(
            "/tmp/repo",
        );
        expect(createProjectMock).toHaveBeenCalledWith({
            name: "repo",
            repoPath: "/tmp/repo",
        });

        expect(result).toEqual({
            structuredContent: {
                projectId: "project-2",
                name: "repo",
                repoPath: "/tmp/repo",
                isNew: true,
            },
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            projectId: "project-2",
                            name: "repo",
                            repoPath: "/tmp/repo",
                            isNew: true,
                        },
                        null,
                        2,
                    ),
                },
            ],
        });
    });

    it("returns tool error payload when a dependency throws", async () => {
        detectRepoRootMock.mockRejectedValue(new Error("git failed"));

        const result = await detect_project({ cwd: "/any" });

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "git failed" }],
        });
    });

    it("handles non-Error thrown values", async () => {
        detectRepoRootMock.mockRejectedValue("not-an-error");

        const result = await detect_project({ cwd: "/any" });

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "Unknown tool error" }],
        });
    });
});
