import { prisma } from "@codelore/database";
import type { UpsertAppStateInput, AppStateRow } from "./types.ts";

export async function upsertAppState(
    projectId: string,
    sessionId: string,
    input: UpsertAppStateInput,
): Promise<AppStateRow> {
    return prisma.appState.upsert({
        where: {
            projectId_section: {
                projectId,
                section: input.section,
            },
        },
        create: {
            projectId,
            section: input.section,
            content: input.content,
            updatedBy: sessionId,
        },
        update: {
            content: input.content,
            updatedBy: sessionId,
        },
    });
}

export async function findAppStateBySection(
    projectId: string,
    section: string,
): Promise<AppStateRow | null> {
    return prisma.appState.findUnique({
        where: {
            projectId_section: {
                projectId,
                section,
            },
        },
    });
}

export async function listAppStates(projectId: string): Promise<AppStateRow[]> {
    return prisma.appState.findMany({
        where: {
            projectId,
        },
        orderBy: {
            section: "asc",
        },
    });
}
