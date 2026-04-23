import type { ToolResult } from "../../shared/types.ts";
import type { DecisionEntry, GetDecisionsResult } from "./types.ts";

import { toToolErrorResult } from "../../shared/errors.ts";
import { listDecisionLogs } from "./decision-log-repository.ts";
import { parseGetDecisionsInput } from "./validation.ts";

export const getDecisionsInputShape = {
    decisionId: "string",
    limit: "number",
};

export const getDecisionsOutputShape = {
    decisions: "array",
};

export async function get_decisions(
    rawInput: unknown,
    projectId: string,
): Promise<ToolResult<GetDecisionsResult>> {
    try {
        const input = parseGetDecisionsInput(rawInput);
        const rows = await listDecisionLogs(projectId, input);

        const decisions: DecisionEntry[] = rows.map((row) => ({
            decisionId: row.id,
            title: row.title,
            reasoning: row.reasoning,
            alternatives: row.alternatives,
            tradeoffs: row.tradeoffs,
            tags: row.tags,
            createdAt: row.createdAt.toISOString(),
            sessionId: row.sessionId,
        }));

        const result: GetDecisionsResult = {
            decisions,
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
