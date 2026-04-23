import type { ToolResult } from "../../shared/types.ts";
import type { LogDecisionResult } from "./types.ts";

import { getRuntimeContext } from "../../shared/context.ts";
import { toToolErrorResult } from "../../shared/errors.ts";
import { createDecisionLog } from "./decision-log-repository.ts";
import { parseLogDecisionInput } from "./validation.ts";

export const logDecisionInputShape = {
    title: "string",
    reasoning: "string",
    alternatives: "string",
    tradeoffs: "string",
    tags: "string",
};

export const logDecisionOutputShape = {
    decisionId: "string",
    title: "string",
    createdAt: "string",
};

export async function log_decision(
    rawInput: unknown,
    projectId: string,
): Promise<ToolResult<LogDecisionResult>> {
    try {
        const input = parseLogDecisionInput(rawInput);
        const context = getRuntimeContext();

        const decision = await createDecisionLog(
            projectId,
            {
                title: input.title,
                reasoning: input.reasoning,
                alternatives: input.alternatives ?? null,
                tradeoffs: input.tradeoffs ?? null,
                tags: input.tags ?? null,
            },
            context.activeSessionId,
        );

        const result: LogDecisionResult = {
            decisionId: decision.id,
            title: decision.title,
            createdAt: decision.createdAt.toISOString(),
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
