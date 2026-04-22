import { startStdioServer } from "./server/transport.ts";

async function main() {
    await startStdioServer();
    console.log("CodeLore MCP server is running on stdio.");
}

main().catch((error) => {
    console.error("Failed to start CodeLore MCP server:", error);
    process.exit(1);
});
