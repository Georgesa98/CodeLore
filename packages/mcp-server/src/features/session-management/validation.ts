import { z } from "zod/v4";

import { ValidationError } from "../../shared/errors.ts";

export const startSessionInputSchema = z.object({
    title: z.string().trim().optional(),
    agentName: z.string().trim().optional(),
});

export const startSessionOutputSchema = z.object({
    sessionId: z.string(),
    projectId: z.string(),
    title: z.string(),
    agentName: z.string(),
    startedAt: z.string(),
    isNew: z.boolean(),
});

export function parseStartSessionInput(input: unknown) {
    const parsed = startSessionInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}

export const endSessionInputSchema = z.object({
    summary: z.string().trim().optional(),
});

export const endSessionOutputSchema = z.object({
    sessionId: z.string(),
    status: z.string(),
    endedAt: z.string(),
});

export function parseEndSessionInput(input: unknown) {
    const parsed = endSessionInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}
