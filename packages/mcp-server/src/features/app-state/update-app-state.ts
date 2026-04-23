import type { ToolResult } from "../../shared/types.ts";
import type { UpdateAppStateResult } from "./types.ts";

import { toToolErrorResult } from "../../shared/errors.ts";
import { upsertAppState } from "./app-state-repository.ts";
import { parseUpdateAppStateInput } from "./validation.ts";

export async function update_app_state(
    rawInput: unknown,
    projectId: string,
    sessionId: string,
): Promise<ToolResult<UpdateAppStateResult>> {
    try {
        const input = parseUpdateAppStateInput(rawInput);

        const appState = await upsertAppState(projectId, sessionId, {
            section: input.section,
            content: input.content,
        });

        const result: UpdateAppStateResult = {
            ok: true,
            section: appState.section,
            updatedAt: appState.updatedAt.toISOString(),
            updatedBy: appState.updatedBy,
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
