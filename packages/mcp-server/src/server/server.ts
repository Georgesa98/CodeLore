import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";

import { detect_project } from "../features/project-detection/detect-project.ts";

export function createServer() {
    const server = new McpServer({
        name: "codelore-mcp-server",
        version: "0.1.0",
    });

    server.registerTool(
        "detect_project",
        {
            title: "Detect Project",
            description:
                "Detect an existing project from cwd or create one if it does not exist.",
            inputSchema: {
                cwd: z
                    .string()
                    .min(1)
                    .describe("Current working directory of the agent process"),
            },
            outputSchema: {
                projectId: z.string(),
                name: z.string(),
                repoPath: z.string(),
                isNew: z.boolean(),
            },
        },
        async (args) => detect_project(args),
    );

    return server;
}
