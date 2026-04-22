import { beforeEach, describe, expect, it, vi } from "vitest";

describe("runtime bootstrap (src/index.ts)", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it("starts server and logs success message", async () => {
        const startStdioServerMock = vi.fn().mockResolvedValue(undefined);

        vi.doMock("../../src/server/transport.ts", () => ({
            startStdioServer: startStdioServerMock,
        }));

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        await import("../../src/index.ts");
        await Promise.resolve();

        expect(startStdioServerMock).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(
            "CodeLore MCP server is running on stdio.",
        );
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it("logs startup failures and exits process", async () => {
        const startStdioServerMock = vi
            .fn()
            .mockRejectedValue(new Error("startup failed"));

        vi.doMock("../../src/server/transport.ts", () => ({
            startStdioServer: startStdioServerMock,
        }));

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const exitSpy = vi
            .spyOn(process, "exit")
            .mockImplementation(((code?: number) => code as never) as never);

        await import("../../src/index.ts");
        await Promise.resolve();
        await Promise.resolve();

        expect(errorSpy).toHaveBeenCalledWith(
            "Failed to start CodeLore MCP server:",
            expect.any(Error),
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});
