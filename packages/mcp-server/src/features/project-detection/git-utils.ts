import { existsSync } from "node:fs";
import path from "node:path";

import { simpleGit } from "simple-git";

import { ProjectDetectionError } from "../../shared/errors.ts";
import { normalizeRepoPath } from "../../utils/path-resolver.ts";

function walkUpToGitBoundary(cwd: string) {
    let current = normalizeRepoPath(cwd);

    while (true) {
        const markerPath = path.join(current, ".git");

        if (existsSync(markerPath)) {
            return current;
        }

        const parent = normalizeRepoPath(path.dirname(current));

        if (parent === current) {
            break;
        }

        current = parent;
    }

    throw new ProjectDetectionError(
        `No git repository found while walking up from: ${cwd}`,
    );
}

export async function detectRepoRoot(cwd: string) {
    const guessedRoot = walkUpToGitBoundary(cwd);
    const git = simpleGit({ baseDir: guessedRoot });
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
        throw new ProjectDetectionError(
            `Path exists but is not a valid git repository: ${guessedRoot}`,
        );
    }

    const rootFromGit = await git.revparse(["--show-toplevel"]);

    return normalizeRepoPath(rootFromGit.trim());
}
