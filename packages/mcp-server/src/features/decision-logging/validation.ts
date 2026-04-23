import { z } from "zod/v4";
import { ValidationError } from "../../shared/errors.ts";

const decisionPayloadSchema = {
    title: z.string().trim().min(1, "title is required"),
    reasoning: z.string().trim().min(1, "reasoning is required"),
    alternatives: z.string().trim().optional(),
    tradeoffs: z.string().trim().optional(),
    tags: z.string().trim().optional(),
};

export const logDecisionInputSchema = z.object(decisionPayloadSchema);

export const logDecisionOutputSchema = z.object({
    decisionId: z.string(),
    title: z.string(),
    createdAt: z.string(),
});

export function parseLogDecisionInput(input: unknown) {
    const parsed = logDecisionInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}

export const updateDecisionLogInputSchema = z.object({
    decisionId: z.string().trim().min(1, "decisionId is required"),
    ...decisionPayloadSchema,
});

export const updateDecisionLogOutputSchema = z.object({
    ok: z.boolean(),
    decisionId: z.string(),
    title: z.string(),
});

export function parseUpdateDecisionLogInput(input: unknown) {
    const parsed = updateDecisionLogInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }
    return parsed.data;
}

export const getDecisionsInputSchema = z.object({
    decisionId: z.string().trim().optional(),
    limit: z.number().int().positive().optional(),
});

export const getDecisionsOutputSchema = z.object({
    decisions: z.array(
        z.object({
            decisionId: z.string(),
            title: z.string(),
            reasoning: z.string(),
            alternatives: z.string().nullable(),
            tradeoffs: z.string().nullable(),
            tags: z.string().nullable(),
            createdAt: z.string(),
            sessionId: z.string().nullable(),
        }),
    ),
});

export function parseGetDecisionsInput(input: unknown) {
    const parsed = getDecisionsInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}
