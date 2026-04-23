import { prisma } from "@codelore/database";
import type { FileChangeRow, CreateFileChangeData } from "./types.ts";

export async function createFileChange(
    projectId: string,
    data: CreateFileChangeData,
    sessionId?: string,
): Promise<FileChangeRow> {
    return prisma.fileChange.create({
        data: {
            projectId,
            sessionId: sessionId ?? null,
            filePath: data.filePath,
            changeType: data.changeType,
            summary: data.summary,
            gitCommit: data.gitCommit,
            branch: data.branch,
        },
    });
}

export async function listFileChanges(
    projectId: string,
    options?: {
        sessionId?: string;
        limit?: number;
    },
): Promise<FileChangeRow[]> {
    return prisma.fileChange.findMany({
        where: {
            projectId,
            ...(options?.sessionId ? { sessionId: options.sessionId } : {}),
        },
        orderBy: {
            createdAt: "desc",
        },
        take: options?.limit,
    });
}
