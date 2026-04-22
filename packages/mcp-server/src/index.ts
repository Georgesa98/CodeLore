import { startStdioServer } from "./server/transport.ts";

async function main() {
    await startStdioServer();
}

main().catch((error) => {
    console.error("Failed to start CodeLore MCP server:", error);
    process.exit(1);
});
