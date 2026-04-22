import type { ToolResult } from "../../shared/types.ts";
import type { AppStateSection, GetAppStateResult } from "./types.ts";

import { toToolErrorResult } from "../../shared/errors.ts";
import {
    findAppStateBySection,
    listAppStates,
} from "./app-state-repository.ts";
import { parseGetAppStateInput } from "./validation.ts";

export const getAppStateInputShape = {
    section: "string",
};

export const getAppStateOutputShape = {
    sections: "array",
};

export async function get_app_state(
    rawInput: unknown,
    projectId: string,
): Promise<ToolResult<GetAppStateResult>> {
    try {
        const input = parseGetAppStateInput(rawInput);

        const rows = input.section
            ? [await findAppStateBySection(projectId, input.section)].filter(
                  (row): row is NonNullable<typeof row> => row !== null,
              )
            : await listAppStates(projectId);

        const sections: AppStateSection[] = rows.map((row) => ({
            section: row.section,
            content: row.content,
            updatedAt: row.updatedAt.toISOString(),
            updatedBy: row.updatedBy,
        }));

        const result: GetAppStateResult = {
            sections,
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
