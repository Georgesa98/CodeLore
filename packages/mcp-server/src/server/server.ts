import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { detect_project } from "../features/project-detection/detect-project.ts";
import { start_session } from "../features/session-management/start-session.ts";
import { end_session } from "../features/session-management/end-session.ts";
import { get_app_state } from "../features/app-state/get-app-state.ts";
import { update_app_state } from "../features/app-state/update-app-state.ts";
import { get_decisions } from "../features/decision-logging/get-decision-log.ts";
import { log_decision } from "../features/decision-logging/log-decision.ts";
import { update_decision_log } from "../features/decision-logging/update-decision-log.ts";
import { get_tasks } from "../features/task-tracking/get-tasks.ts";
import { update_task } from "../features/task-tracking/update-task.ts";
import { create_task } from "../features/task-tracking/create-task.ts";
import { get_file_changes } from "../features/track-files/get-file-changes.ts";
import { track_file_change } from "../features/track-files/track-file-changes.ts";
import type { DetectProjectResult } from "../features/project-detection/types.ts";
import {
    getAppStateInputSchema,
    getAppStateOutputSchema,
    updateAppStateInputSchema,
    updateAppStateOutputSchema,
} from "../features/app-state/validation.ts";
import {
    getDecisionsInputSchema,
    getDecisionsOutputSchema,
    logDecisionInputSchema,
    logDecisionOutputSchema,
    updateDecisionLogInputSchema,
    updateDecisionLogOutputSchema,
} from "../features/decision-logging/validation.ts";
import {
    endSessionInputSchema,
    endSessionOutputSchema,
    startSessionInputSchema,
    startSessionOutputSchema,
} from "../features/session-management/validation.ts";
import {
    createTaskInputSchema,
    createTaskOutputSchema,
    updateTaskInputSchema,
    updateTaskOutputSchema,
    getTasksInputSchema,
    getTasksOutputSchema,
} from "../features/task-tracking/validation.ts";
import {
    getFileChangesInputSchema,
    getFileChangesOutputSchema,
    trackFileChangeInputSchema,
    trackFileChangeOutputSchema,
} from "../features/track-files/validation.ts";
import { getRuntimeContext, setActiveProjectId } from "../shared/context.ts";
import { ConfigurationError } from "../shared/errors.ts";
import type { ToolErrorContent, ToolResult } from "../shared/types.ts";

function getToolErrorMessage(result: {
    content?: Array<{ type: string; text: string }>;
}) {
    return result.content?.find((entry) => entry.type === "text")?.text;
}

function isToolError(result: ToolResult<unknown>): result is ToolErrorContent {
    return "isError" in result && result.isError === true;
}

export async function resolveCwdFromWorkspaceRoots(server: McpServer) {
    try {
        const { roots } = await server.server.listRoots();

        if (roots.length === 0) {
            throw new ConfigurationError(
                "MCP request context did not include any workspace roots",
            );
        } else if (roots.length > 1) {
            return fileURLToPath(roots[0].uri);
        }
    } catch {}
    return process.cwd();
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

async function ensureActiveProjectId(server: McpServer) {
    const context = getRuntimeContext();

    if (context.activeProjectId) {
        return context.activeProjectId;
    }

    const project = await resolveActiveProject(server);
    return project.projectId;
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
            const projectId = await ensureActiveProjectId(server);
            const result = await start_session(args, projectId);
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
            await ensureActiveProjectId(server);
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
            const projectId = await ensureActiveProjectId(server);
            if (!context.activeSessionId) {
                throw new ConfigurationError(
                    "No active session. Call start_session first.",
                );
            }

            const result = await update_app_state(
                args,
                projectId,
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
            const projectId = await ensureActiveProjectId(server);
            const result = await get_app_state(args, projectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to get app state",
                );
            }

            return result;
        },
    );

    server.registerTool(
        "log_decision",
        {
            title: "Log Decision",
            description:
                "Create a decision log entry for the active project, and attach it to the current session when available.",
            inputSchema: logDecisionInputSchema,
            outputSchema: logDecisionOutputSchema,
        },
        async (args) => {
            const projectId = await ensureActiveProjectId(server);
            const result = await log_decision(args, projectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to log decision",
                );
            }

            return result;
        },
    );

    server.registerTool(
        "update_decision_log",
        {
            title: "Update Decision Log",
            description:
                "Update an existing decision log entry for the active project.",
            inputSchema: updateDecisionLogInputSchema,
            outputSchema: updateDecisionLogOutputSchema,
        },
        async (args) => {
            const projectId = await ensureActiveProjectId(server);
            const result = await update_decision_log(args, projectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ??
                        "Failed to update decision log",
                );
            }

            return result;
        },
    );

    server.registerTool(
        "get_decisions",
        {
            title: "Get Decisions",
            description:
                "Get decision logs for the active project, optionally filtered by decision ID and limit.",
            inputSchema: getDecisionsInputSchema,
            outputSchema: getDecisionsOutputSchema,
        },
        async (args) => {
            const projectId = await ensureActiveProjectId(server);
            const result = await get_decisions(args, projectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to get decisions",
                );
            }

            return result;
        },
    );
    server.registerTool(
        "create_task",
        {
            title: "Create Task",
            description:
                "Create a new task or subtask for the current session.",
            inputSchema: createTaskInputSchema,
            outputSchema: createTaskOutputSchema,
        },
        async (args) => {
            const projectId = await ensureActiveProjectId(server);
            const result = await create_task(args, projectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to create task",
                );
            }
            return result;
        },
    );

    server.registerTool(
        "update_task",
        {
            title: "Update Task",
            description:
                "Update the status of a task (pending, in_progress, done, blocked).",
            inputSchema: updateTaskInputSchema,
            outputSchema: updateTaskOutputSchema,
        },
        async (args) => {
            const projectId = await ensureActiveProjectId(server);
            const result = await update_task(args, projectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to update task",
                );
            }
            return result;
        },
    );

    server.registerTool(
        "get_tasks",
        {
            title: "Get Tasks",
            description:
                "Get the task list for the active session, including nested subtasks.",
            inputSchema: getTasksInputSchema,
            outputSchema: getTasksOutputSchema,
        },
        async (args) => {
            const projectId = await ensureActiveProjectId(server);
            const result = await get_tasks(args, projectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to get tasks",
                );
            }
            return result;
        },
    );
    server.registerTool(
        "track_file_change",
        {
            title: "Track File Change",
            description:
                "Record a file change (created, modified, deleted). Automatically enriches with git commit and branch.",
            inputSchema: trackFileChangeInputSchema,
            outputSchema: trackFileChangeOutputSchema,
        },
        async (args) => {
            const context = getRuntimeContext();
            const projectId = await ensureActiveProjectId(server);
            const projectPath = await resolveCwdFromWorkspaceRoots(server);
            const sessionId = context.activeSessionId ?? undefined;
            const result = await track_file_change(
                args,
                projectId,
                projectPath,
                sessionId,
            );
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ??
                        "Failed to track file change",
                );
            }

            return result;
        },
    );

    server.registerTool(
        "get_file_changes",
        {
            title: "Get File Changes",
            description:
                "Get file change logs for the active project, optionally filtered by session ID and limit.",
            inputSchema: getFileChangesInputSchema,
            outputSchema: getFileChangesOutputSchema,
        },
        async (args) => {
            const projectId = await ensureActiveProjectId(server);
            const result = await get_file_changes(args, projectId);
            if (isToolError(result)) {
                throw new Error(
                    getToolErrorMessage(result) ?? "Failed to get file changes",
                );
            }

            return result;
        },
    );
    return server;
}
