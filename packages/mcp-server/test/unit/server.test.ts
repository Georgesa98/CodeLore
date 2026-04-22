import { describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const { detectProjectMock } = vi.hoisted(() => ({
    detectProjectMock: vi.fn(),
}));

vi.mock("../../src/features/project-detection/detect-project.ts", () => ({
    detect_project: detectProjectMock,
}));

import { createServer } from "../../src/server/server.ts";

describe("server/createServer", () => {
    it("creates an MCP server and registers detect_project tool", async () => {
        detectProjectMock.mockResolvedValue({ ok: true });

        const registerToolSpy = vi.spyOn(McpServer.prototype, "registerTool");

        const server = createServer();

        expect(server).toBeInstanceOf(McpServer);
        expect(registerToolSpy).toHaveBeenCalledTimes(1);

        const [toolName, metadata, handler] = registerToolSpy.mock.calls[0] as [
            string,
            {
                title: string;
                description: string;
                inputSchema: {
                    cwd: { safeParse: (value: unknown) => unknown };
                };
                outputSchema: {
                    projectId: { safeParse: (value: unknown) => unknown };
                    name: { safeParse: (value: unknown) => unknown };
                    repoPath: { safeParse: (value: unknown) => unknown };
                    isNew: { safeParse: (value: unknown) => unknown };
                };
            },
            unknown,
        ];

        expect(toolName).toBe("detect_project");
        expect(metadata.title).toBe("Detect Project");
        expect(metadata.description).toContain("Detect an existing project");
        expect(typeof handler).toBe("function");

        await (handler as (args: unknown) => Promise<unknown>)({ cwd: "/tmp/repo" });
        expect(detectProjectMock).toHaveBeenCalledWith({ cwd: "/tmp/repo" });

        registerToolSpy.mockRestore();
    });
});
