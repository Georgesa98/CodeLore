import type { ToolResult } from "../../shared/types.ts";
import type { UpdateTaskResult } from "./types.ts";

import { toToolErrorResult } from "../../shared/errors.ts";
import { updateTask } from "./task-repository.ts";
import { parseUpdateTaskInput } from "./validation.ts";

export const updateTaskInputShape = {
    taskId: "string",
    status: "string",
};

export const updateTaskOutputShape = {
    ok: "boolean",
    taskId: "string",
    newStatus: "string",
};

export async function update_task(
    rawInput: unknown,
    projectId: string,
): Promise<ToolResult<UpdateTaskResult>> {
    try {
        const input = parseUpdateTaskInput(rawInput);
        const updated = await updateTask(projectId, input);

        if (!updated) {
            throw new Error("Task not found in active project.");
        }

        const result: UpdateTaskResult = {
            ok: true,
            taskId: updated.taskId,
            newStatus: updated.status,
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
