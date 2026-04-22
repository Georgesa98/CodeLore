import { describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const {
    detectProjectMock,
    startSessionMock,
    runtimeContext,
    setActiveProjectIdMock,
} = vi.hoisted(() => ({
    detectProjectMock: vi.fn(),
    startSessionMock: vi.fn(),
    runtimeContext: {
        activeProjectId: undefined as string | undefined,
        activeSessionId: undefined as string | undefined,
    },
    setActiveProjectIdMock: vi.fn(),
}));

vi.mock("../../src/features/project-detection/detect-project.ts", () => ({
    detect_project: detectProjectMock,
}));

vi.mock("../../src/features/session-management/start-session.ts", () => ({
    start_session: startSessionMock,
}));

vi.mock("../../src/shared/context.ts", () => ({
    getRuntimeContext: () => runtimeContext,
    setActiveProjectId: (projectId?: string) => {
        runtimeContext.activeProjectId = projectId;
        setActiveProjectIdMock(projectId);
    },
}));

import {
    createServer,
    resolveActiveProject,
    resolveCwdFromWorkspaceRoots,
} from "../../src/server/server.ts";
import { ConfigurationError } from "../../src/shared/errors.ts";

describe("server/createServer", () => {
    it("auto-resolves project when start_session is called without activeProjectId", async () => {
        runtimeContext.activeProjectId = undefined;
        runtimeContext.activeSessionId = undefined;

        const registerToolSpy = vi.spyOn(McpServer.prototype, "registerTool");
        const server = createServer();

        Object.assign(server.server as any, {
            listRoots: vi.fn().mockResolvedValue({
                roots: [{ uri: "file:///tmp/repo" }],
            }),
        });

        detectProjectMock.mockResolvedValue({
            structuredContent: {
                projectId: "project-123",
                name: "repo",
                repoPath: "/tmp/repo",
                isNew: false,
            },
            content: [{ type: "text", text: "ok" }],
        });

        startSessionMock.mockResolvedValue({
            structuredContent: {
                sessionId: "session-123",
                projectId: "project-123",
                title: "",
                agentName: "",
                startedAt: "2026-04-22T00:00:00.000Z",
                isNew: true,
            },
            content: [{ type: "text", text: "ok" }],
        });

        const startSessionHandler = registerToolSpy.mock.calls.find(
            (call) => call[0] === "start_session",
        )?.[2] as (args: unknown) => Promise<unknown>;

        await expect(
            startSessionHandler({ title: "Planning" }),
        ).resolves.toEqual({
            structuredContent: {
                sessionId: "session-123",
                projectId: "project-123",
                title: "",
                agentName: "",
                startedAt: "2026-04-22T00:00:00.000Z",
                isNew: true,
            },
            content: [{ type: "text", text: "ok" }],
        });

        expect(detectProjectMock).toHaveBeenCalledWith({ cwd: "/tmp/repo" });
        expect(setActiveProjectIdMock).toHaveBeenCalledWith("project-123");
        expect(startSessionMock).toHaveBeenCalledWith(
            { title: "Planning" },
            "project-123",
        );

        registerToolSpy.mockRestore();
    });

    it("creates an MCP server and registers session and app-state tools", () => {
        const registerToolSpy = vi.spyOn(McpServer.prototype, "registerTool");

        const server = createServer();

        expect(server).toBeInstanceOf(McpServer);
        expect(registerToolSpy).toHaveBeenCalledTimes(4);
        expect(registerToolSpy.mock.calls[0][0]).toBe("start_session");
        expect(registerToolSpy.mock.calls[1][0]).toBe("end_session");
        expect(registerToolSpy.mock.calls[2][0]).toBe("update_app_state");
        expect(registerToolSpy.mock.calls[3][0]).toBe("get_app_state");

        registerToolSpy.mockRestore();
    });

    it("resolves cwd from first workspace root", async () => {
        const server = createServer();

        Object.assign(server.server as any, {
            listRoots: vi.fn().mockResolvedValue({
                roots: [{ uri: "file:///tmp/repo" }],
            }),
        });

        await expect(resolveCwdFromWorkspaceRoots(server)).resolves.toBe(
            "/tmp/repo",
        );
    });

    it("rejects cwd resolution when no workspace roots are available", async () => {
        const server = createServer();

        Object.assign(server.server as any, {
            listRoots: vi.fn().mockResolvedValue({ roots: [] }),
        });

        await expect(
            resolveCwdFromWorkspaceRoots(server),
        ).rejects.toBeInstanceOf(ConfigurationError);
    });

    it("resolves active project and stores activeProjectId", async () => {
        const server = createServer();

        Object.assign(server.server as any, {
            listRoots: vi.fn().mockResolvedValue({
                roots: [{ uri: "file:///tmp/repo" }],
            }),
        });

        detectProjectMock.mockResolvedValue({
            structuredContent: {
                projectId: "project-123",
                name: "repo",
                repoPath: "/tmp/repo",
                isNew: false,
            },
            content: [{ type: "text", text: "ok" }],
        });

        await expect(resolveActiveProject(server)).resolves.toEqual({
            projectId: "project-123",
            name: "repo",
            repoPath: "/tmp/repo",
            isNew: false,
        });

        expect(detectProjectMock).toHaveBeenCalledWith({ cwd: "/tmp/repo" });
        expect(setActiveProjectIdMock).toHaveBeenCalledWith("project-123");
    });

    it("throws ConfigurationError when internal detection returns tool error", async () => {
        const server = createServer();

        Object.assign(server.server as any, {
            listRoots: vi.fn().mockResolvedValue({
                roots: [{ uri: "file:///tmp/repo" }],
            }),
        });

        detectProjectMock.mockResolvedValue({
            isError: true,
            content: [{ type: "text", text: "detection failed" }],
        });

        await expect(resolveActiveProject(server)).rejects.toThrow(
            "detection failed",
        );
        expect(setActiveProjectIdMock).not.toHaveBeenCalled();
    });
});
