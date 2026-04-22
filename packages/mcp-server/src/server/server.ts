import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { detect_project } from "../features/project-detection/detect-project.ts";
import { start_session } from "../features/session-management/start-session.ts";
import { end_session } from "../features/session-management/end-session.ts";
import { get_app_state } from "../features/app-state/get-app-state.ts";
import { update_app_state } from "../features/app-state/update-app-state.ts";
import type { DetectProjectResult } from "../features/project-detection/types.ts";
import {
    getAppStateInputSchema,
    getAppStateOutputSchema,
    updateAppStateInputSchema,
    updateAppStateOutputSchema,
} from "../features/app-state/validation.ts";
import {
    endSessionInputSchema,
    endSessionOutputSchema,
    startSessionInputSchema,
    startSessionOutputSchema,
} from "../features/session-management/validation.ts";
import { getRuntimeContext, setActiveProjectId } from "../shared/context.ts";
import { ConfigurationError } from "../shared/errors.ts";
import type {
    ToolErrorContent,
    ToolResult,
} from "../shared/types.ts";

function getToolErrorMessage(result: {
    content?: Array<{ type: string; text: string }>;
}) {
    return result.content?.find((entry) => entry.type === "text")?.text;
}

function isToolError(
    result: ToolResult<unknown>,
): result is ToolErrorContent {
    return "isError" in result && result.isError === true;
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

    server.registerTool(
        "start_session",
        {
            title: "Start Session",
            description: "Start a new session for this project.",
            inputSchema: startSessionInputSchema,
            outputSchema: startSessionOutputSchema,
        },
        async (args) => {
            const context = getRuntimeContext();
            if (!context.activeProjectId) {
                throw new ConfigurationError(
                    "No active project. Call detect_project first.",
                );
            }
            const result = await start_session(args, context.activeProjectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to start session",
                );
            }

            return result;
        },
    );

    server.registerTool(
        "end_session",
        {
            title: "End Session",
            description: "End the current session.",
            inputSchema: endSessionInputSchema,
            outputSchema: endSessionOutputSchema,
        },
        async (args) => {
            const context = getRuntimeContext();
            if (!context.activeProjectId) {
                throw new ConfigurationError(
                    "No active project. Call start_session first.",
                );
            }
            if (!context.activeSessionId) {
                throw new ConfigurationError("No active session.");
            }
            const result = await end_session(args, context.activeSessionId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to end session",
                );
            }

            return result;
        },
    );

    server.registerTool(
        "update_app_state",
        {
            title: "Update App State",
            description:
                "Create or update a living documentation section for the active project.",
            inputSchema: updateAppStateInputSchema,
            outputSchema: updateAppStateOutputSchema,
        },
        async (args) => {
            const context = getRuntimeContext();
            if (!context.activeProjectId) {
                throw new ConfigurationError(
                    "No active project. Call detect_project first.",
                );
            }
            if (!context.activeSessionId) {
                throw new ConfigurationError(
                    "No active session. Call start_session first.",
                );
            }

            const result = await update_app_state(
                args,
                context.activeProjectId,
                context.activeSessionId,
            );
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to update app state",
                );
            }

            return result;
        },
    );

    server.registerTool(
        "get_app_state",
        {
            title: "Get App State",
            description:
                "Get app-state sections for the active project, optionally filtered by section.",
            inputSchema: getAppStateInputSchema,
            outputSchema: getAppStateOutputSchema,
        },
        async (args) => {
            const context = getRuntimeContext();
            if (!context.activeProjectId) {
                throw new ConfigurationError(
                    "No active project. Call detect_project first.",
                );
            }

            const result = await get_app_state(args, context.activeProjectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to get app state",
                );
            }

            return result;
        },
    );

    return server;
}