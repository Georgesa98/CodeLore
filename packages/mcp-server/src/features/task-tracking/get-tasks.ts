import type { ToolResult } from "../../shared/types.ts";
import type { GetTasksResult } from "./types.ts";

import { getRuntimeContext } from "../../shared/context.ts";
import { toToolErrorResult } from "../../shared/errors.ts";
import { listTasksBySession } from "./task-repository.ts";
import { parseGetTasksInput } from "./validation.ts";

export const getTasksInputShape = {};

export const getTasksOutputShape = {
    tasks: "array",
};

export async function get_tasks(
    rawInput: unknown,
    projectId: string,
): Promise<ToolResult<GetTasksResult>> {
    try {
        parseGetTasksInput(rawInput);
        const context = getRuntimeContext();

        if (!context.activeSessionId) {
            throw new Error("No active session. Call start_session first.");
        }

        const tasks = await listTasksBySession(
            projectId,
            context.activeSessionId,
        );

        const result: GetTasksResult = {
            tasks,
        };

        return {
            structuredContent: result,
            content: [
                {
                    type: "text" as const,
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        return toToolErrorResult(error);
    }
}
