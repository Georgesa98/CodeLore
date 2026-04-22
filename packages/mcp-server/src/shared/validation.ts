import { z } from "zod/v4";

import { ValidationError } from "./errors.ts";

export const detectProjectInputSchema = z.object({
    cwd: z.string().trim().min(1, "cwd is required"),
});

export function parseDetectProjectInput(input: unknown) {
    const parsed = detectProjectInputSchema.safeParse(input);

    if (!parsed.success) {
        throw new ValidationError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
        );
    }

    return parsed.data;
}
