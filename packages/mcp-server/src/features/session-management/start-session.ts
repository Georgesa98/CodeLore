import type { ToolResult } from "../../shared/types.ts";
import type { StartSessionResult } from "./types.ts";

import { closeStaleSessions, startSession } from "./session-repository.ts";
import { setActiveSessionId } from "../../shared/context.ts";
import { toToolErrorResult } from "../../shared/errors.ts";
import { parseStartSessionInput } from "./validation.ts";

export const startSessionInputShape = {
    title: "string",
    agentName: "string",
};

export const startSessionOutputShape = {
    sessionId: "string",
    projectId: "string",
    title: "string",
    agentName: "string",
    startedAt: "string",
    isNew: "boolean",
};

export async function start_session(
    rawInput: unknown,
    projectId: string,
): Promise<ToolResult<StartSessionResult>> {
    try {
        const input = parseStartSessionInput(rawInput);

        await closeStaleSessions(projectId);

        const session = await startSession(projectId, {
            title: input.title,
            agentName: input.agentName,
        });

        setActiveSessionId(session.id);

        const result: StartSessionResult = {
            sessionId: session.id,
            projectId: session.projectId,
            title: session.title ?? "",
            agentName: session.agentName ?? "",
            startedAt: session.startedAt.toISOString(),
            isNew: true,
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
