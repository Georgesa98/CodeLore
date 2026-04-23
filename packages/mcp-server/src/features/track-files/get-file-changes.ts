import type { ToolResult } from "../../shared/types.ts";
import type { GetFileChangesResult, FileChangeEntry } from "./types.ts";

import { toToolErrorResult } from "../../shared/errors.ts";
import { listFileChanges } from "./track-files-repository.ts";
import { parseGetFileChangesInput } from "./validation.ts";

export const getFileChangesInputShape = {
    sessionId: "string",
    limit: "number",
};

export const getFileChangesOutputShape = {
    changes: "array",
};

export async function get_file_changes(
    rawInput: unknown,
    projectId: string,
): Promise<ToolResult<GetFileChangesResult>> {
    try {
        const input = parseGetFileChangesInput(rawInput);
        const rows = await listFileChanges(projectId, input);

        const changes: FileChangeEntry[] = rows.map((row) => ({
            id: row.id,
            filePath: row.filePath,
            changeType: row.changeType,
            summary: row.summary,
            gitCommit: row.gitCommit,
            branch: row.branch,
            createdAt: row.createdAt.toISOString(),
            sessionId: row.sessionId,
        }));

        const result: GetFileChangesResult = { changes };

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
