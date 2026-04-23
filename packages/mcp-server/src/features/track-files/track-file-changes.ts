import { simpleGit } from "simple-git";

import type { ToolResult } from "../../shared/types.ts";
import type { TrackFileChangeResult } from "./types.ts";

import { toToolErrorResult } from "../../shared/errors.ts";
import { createFileChange } from "./track-files-repository.ts";
import { parseTrackFileChangeInput } from "./validation.ts";

export const trackFileChangeInputShape = {
    filePath: "string",
    changeType: "string",
    summary: "string",
};

export const trackFileChangeOutputShape = {
    ok: "boolean",
    filePath: "string",
    gitCommit: "string",
    branch: "string",
};

async function getGitInfo(
    projectPath: string,
): Promise<{ gitCommit: string | null; branch: string | null }> {
    try {
        const git = simpleGit(projectPath);
        const [commit, branch] = await Promise.all([
            git.revparse(["HEAD"]),
            git.revparse(["--abbrev-ref", "HEAD"]),
        ]);
        return { gitCommit: commit, branch };
    } catch {
        // Not a git repo or git not available — fail silently
        return { gitCommit: null, branch: null };
    }
}

export async function track_file_change(
    rawInput: unknown,
    projectId: string,
    projectPath: string,
    sessionId?: string,
): Promise<ToolResult<TrackFileChangeResult>> {
    try {
        const input = parseTrackFileChangeInput(rawInput);
        const { gitCommit, branch } = await getGitInfo(projectPath);

        await createFileChange(
            projectId,
            {
                filePath: input.filePath,
                changeType: input.changeType,
                summary: input.summary,
                gitCommit,
                branch,
            },
            sessionId,
        );

        const result: TrackFileChangeResult = {
            ok: true,
            filePath: input.filePath,
            gitCommit,
            branch,
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
