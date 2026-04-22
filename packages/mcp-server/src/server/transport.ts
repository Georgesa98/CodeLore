import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "./server.ts";

export async function startStdioServer() {
    const server = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    return server;
}
