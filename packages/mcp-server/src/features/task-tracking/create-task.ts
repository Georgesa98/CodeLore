import type { ToolResult } from "../../shared/types.ts";
import type { CreateTaskResult } from "./types.ts";

import { getRuntimeContext } from "../../shared/context.ts";
import { toToolErrorResult } from "../../shared/errors.ts";
import { createTask } from "./task-repository.ts";
import { parseCreateTaskInput } from "./validation.ts";

export const createTaskInputShape = {
    title: "string",
    description: "string",
    priority: "number",
    order: "number",
    parentId: "string",
};

export const createTaskOutputShape = {
    taskId: "string",
    status: "string",
};

export async function create_task(
    rawInput: unknown,
    projectId: string,
): Promise<ToolResult<CreateTaskResult>> {
    try {
        const input = parseCreateTaskInput(rawInput);
        const context = getRuntimeContext();

        const task = await createTask(
            projectId,
            context.activeSessionId ?? null,
            input,
        );

        const result: CreateTaskResult = {
            taskId: task.taskId,
            status: task.status,
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
