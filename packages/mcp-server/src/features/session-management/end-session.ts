import type { ToolResult } from "../../shared/types.ts";
import type { EndSessionResult } from "./types.ts";

import { endSession } from "./session-repository.ts";
import { setActiveSessionId } from "../../shared/context.ts";
import { toToolErrorResult } from "../../shared/errors.ts";
import { parseEndSessionInput } from "./validation.ts";

export const endSessionInputShape = {
    summary: "string",
};

export const endSessionOutputShape = {
    sessionId: "string",
    status: "string",
    endedAt: "string",
};

export async function end_session(
    rawInput: unknown,
    sessionId: string,
): Promise<ToolResult<EndSessionResult>> {
    try {
        const input = parseEndSessionInput(rawInput);

        const session = await endSession(sessionId, input.summary ?? null);

        setActiveSessionId(undefined);

        const result: EndSessionResult = {
            sessionId: session.id,
            status: session.status,
            endedAt: session.endedAt!.toISOString(),
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
