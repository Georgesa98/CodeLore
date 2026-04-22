import path from "node:path";

import { ValidationError } from "../shared/errors.ts";

export function normalizeRepoPath(inputPath: string) {
    const absolute = path.isAbsolute(inputPath)
        ? inputPath
        : path.resolve(inputPath);
    const normalized = path.normalize(absolute);

    return normalized.replace(/\\/g, "/");
}

export function getProjectNameFromRepoPath(repoPath: string) {
    const name = path.basename(repoPath);

    if (!name) {
        throw new ValidationError(
            "Could not derive project name from repository path",
        );
    }

    return name;
}
