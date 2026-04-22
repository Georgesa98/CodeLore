import { z } from "zod/v4";

import { ValidationError } from "../../shared/errors.ts";

export const updateAppStateInputSchema = z.object({
    section: z.string().trim().min(1, "section is required"),
    content: z.string().trim().min(1, "content is required"),
});

export const updateAppStateOutputSchema = z.object({
    ok: z.boolean(),
    section: z.string(),
    updatedAt: z.string(),
    updatedBy: z.string().nullable(),
});

export function parseUpdateAppStateInput(input: unknown) {
    const parsed = updateAppStateInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}

export const getAppStateInputSchema = z.object({
    section: z.string().trim().min(1, "section is required").optional(),
});

export const getAppStateOutputSchema = z.object({
    sections: z.array(
        z.object({
            section: z.string(),
            content: z.string(),
            updatedAt: z.string(),
            updatedBy: z.string().nullable(),
        }),
    ),
});

export function parseGetAppStateInput(input: unknown) {
    const parsed = getAppStateInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}
