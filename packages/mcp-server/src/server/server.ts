import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { detect_project } from "../features/project-detection/detect-project.ts";
import { setActiveProjectId } from "../shared/context.ts";
import { ConfigurationError } from "../shared/errors.ts";
import type {
    DetectProjectResult,
    ToolErrorContent,
    ToolResult,
} from "../shared/types.ts";

function getToolErrorMessage(result: {
    content?: Array<{ type: string; text: string }>;
}) {
    return result.content?.find((entry) => entry.type === "text")?.text;
}

export async function resolveCwdFromWorkspaceRoots(server: McpServer) {
    const { roots } = await server.server.listRoots();

    if (roots.length === 0) {
        throw new ConfigurationError(
            "MCP request context did not include any workspace roots",
        );
    }

    return fileURLToPath(roots[0].uri);
}

function isToolError(
    result: ToolResult,
): result is ToolErrorContent {
    return "isError" in result && result.isError === true;
}

export async function resolveActiveProject(server: McpServer) {
    const cwd = await resolveCwdFromWorkspaceRoots(server);
    const result = await detect_project({ cwd });

    if (isToolError(result)) {
        throw new ConfigurationError(
            getToolErrorMessage(result) ?? "Project detection failed",
        );
    }

    const project = result.structuredContent as DetectProjectResult;
    setActiveProjectId(project.projectId);

    return project;
}

export function createServer() {
    const server = new McpServer({
        name: "codelore-mcp-server",
        version: "0.1.0",
    });

    return server;
}
