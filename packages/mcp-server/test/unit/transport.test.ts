import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerMock, stdioTransportCtorMock } = vi.hoisted(() => ({
    createServerMock: vi.fn(),
    stdioTransportCtorMock: vi.fn(),
}));

vi.mock("../../src/server/server.ts", () => ({
    createServer: createServerMock,
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
    StdioServerTransport: function StdioServerTransport() {
        return stdioTransportCtorMock();
    },
}));

import { startStdioServer } from "../../src/server/transport.ts";

describe("server/startStdioServer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("connects server to stdio transport and returns server", async () => {
        const transport = { transport: "stdio" };
        const connectMock = vi.fn().mockResolvedValue(undefined);
        const server = { connect: connectMock };

        createServerMock.mockReturnValue(server);
        stdioTransportCtorMock.mockReturnValue(transport);

        const returnedServer = await startStdioServer();

        expect(createServerMock).toHaveBeenCalledTimes(1);
        expect(stdioTransportCtorMock).toHaveBeenCalledTimes(1);
        expect(connectMock).toHaveBeenCalledWith(transport);
        expect(returnedServer).toBe(server);
    });
});
