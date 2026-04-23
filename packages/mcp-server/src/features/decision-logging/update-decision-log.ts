import type { ToolResult } from "../../shared/types.ts";
import type { UpdateDecisionLogResult } from "./types.ts";

import { ValidationError, toToolErrorResult } from "../../shared/errors.ts";
import { updateDecisionLog } from "./decision-log-repository.ts";
import { parseUpdateDecisionLogInput } from "./validation.ts";

export const updateDecisionLogInputShape = {
    decisionId: "string",
    title: "string",
    reasoning: "string",
    alternatives: "string",
    tradeoffs: "string",
    tags: "string",
};

export const updateDecisionLogOutputShape = {
    ok: "boolean",
    decisionId: "string",
    title: "string",
};

export async function update_decision_log(
    rawInput: unknown,
    projectId: string,
): Promise<ToolResult<UpdateDecisionLogResult>> {
    try {
        const input = parseUpdateDecisionLogInput(rawInput);

        const decision = await updateDecisionLog(projectId, input.decisionId, {
            title: input.title,
            reasoning: input.reasoning,
            alternatives: input.alternatives ?? null,
            tradeoffs: input.tradeoffs ?? null,
            tags: input.tags ?? null,
        });

        if (!decision) {
            throw new ValidationError(
                "Decision not found for the active project.",
            );
        }

        const result: UpdateDecisionLogResult = {
            ok: true,
            decisionId: decision.id,
            title: decision.title,
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
