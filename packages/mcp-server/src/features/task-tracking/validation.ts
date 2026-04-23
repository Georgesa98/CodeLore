import { z } from "zod/v4";

import { ValidationError } from "../../shared/errors.ts";

export const createTaskInputSchema = z.object({
    title: z.string().trim().min(1, "title is required"),
    description: z.string().trim().optional().nullable().default(null),
    priority: z.number().int().min(0).optional().default(0),
    order: z.number().int().min(0).optional().default(0),
    parentId: z.string().trim().optional().nullable().default(null),
});

export const createTaskOutputSchema = z.object({
    taskId: z.string(),
    status: z.string(),
});

export function parseCreateTaskInput(input: unknown) {
    const parsed = createTaskInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}

export const updateTaskInputSchema = z.object({
    taskId: z.string().trim().min(1, "taskId is required"),
    status: z.enum(["pending", "in_progress", "done", "blocked"]),
});

export const updateTaskOutputSchema = z.object({
    ok: z.boolean(),
    taskId: z.string(),
    newStatus: z.string(),
});

export function parseUpdateTaskInput(input: unknown) {
    const parsed = updateTaskInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}

export const getTasksInputSchema = z.object({}).passthrough();

export const getTasksOutputSchema = z.object({
    tasks: z.array(
        z.object({
            taskId: z.string(),
            title: z.string(),
            description: z.string().nullable(),
            priority: z.number(),
            order: z.number(),
            status: z.string(),
            parentId: z.string().nullable(),
            createdAt: z.string(),
            completedAt: z.string().nullable(),
            subtasks: z.array(z.any()),
        }),
    ),
});

export function parseGetTasksInput(input: unknown) {
    const parsed = getTasksInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}
