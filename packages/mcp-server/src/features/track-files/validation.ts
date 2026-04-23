import { z } from "zod/v4";

import { ValidationError } from "../../shared/errors.ts";

export const trackFileChangeInputSchema = z.object({
    filePath: z.string().trim().min(1, "filePath is required"),
    changeType: z.enum(["created", "modified", "deleted"]),
    summary: z.string().trim().optional().nullable().default(null),
});

export const trackFileChangeOutputSchema = z.object({
    ok: z.boolean(),
    filePath: z.string(),
    gitCommit: z.string().nullable(),
    branch: z.string().nullable(),
});

export function parseTrackFileChangeInput(input: unknown) {
    const parsed = trackFileChangeInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}
export const getFileChangesInputSchema = z.object({
    sessionId: z.string().trim().optional(),
    limit: z.number().int().min(1).max(100).optional(),
});
export const getFileChangesOutputSchema = z.object({
    changes: z.array(
        z.object({
            id: z.string(),
            filePath: z.string(),
            changeType: z.string(),
            summary: z.string().nullable(),
            gitCommit: z.string().nullable(),
            branch: z.string().nullable(),
            createdAt: z.string(),
            sessionId: z.string().nullable(),
        }),
    ),
});
export function parseGetFileChangesInput(input: unknown) {
    const parsed = getFileChangesInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}
