import type {
    ToolErrorContent,
    ToolSuccessContent,
} from "../../shared/types.ts";
import type { DetectProjectResult } from "./types.ts";

import { toToolErrorResult } from "../../shared/errors.ts";
import { parseDetectProjectInput } from "../../shared/validation.ts";
import { getProjectNameFromRepoPath } from "../../utils/path-resolver.ts";
import { createProject, findProjectByRepoPath } from "./project-repository.ts";
import { detectRepoRoot } from "./git-utils.ts";

export const detectProjectInputShape = {
    cwd: "string",
};

export const detectProjectOutputShape = {
    projectId: "string",
    name: "string",
    repoPath: "string",
    isNew: "boolean",
};

export async function detect_project(
    rawInput: unknown,
): Promise<ToolSuccessContent<DetectProjectResult> | ToolErrorContent> {
    try {
        const { cwd } = parseDetectProjectInput(rawInput);
        const repoPath = await detectRepoRoot(cwd);

        const existingProject = await findProjectByRepoPath(repoPath);

        if (existingProject) {
            const result: DetectProjectResult = {
                projectId: existingProject.id,
                name: existingProject.name,
                repoPath: existingProject.repoPath,
                isNew: false,
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
        }

        const newProject = await createProject({
            name: getProjectNameFromRepoPath(repoPath),
            repoPath,
        });

        const created: DetectProjectResult = {
            projectId: newProject.id,
            name: newProject.name,
            repoPath: newProject.repoPath,
            isNew: true,
        };

        return {
            structuredContent: created,
            content: [
                {
                    type: "text" as const,
                    text: JSON.stringify(created, null, 2),
                },
            ],
        };
    } catch (error) {
        return toToolErrorResult(error);
    }
}
