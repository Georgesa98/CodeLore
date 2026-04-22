import { prisma } from "@codelore/database";

export type SessionRow = {
    id: string;
    projectId: string;
    title: string | null;
    agentName: string | null;
    status: string;
    summary: string | null;
    startedAt: Date;
    endedAt: Date | null;
};

type StartSessionInput = {
    title?: string | null;
    agentName?: string | null;
};

export async function findOpenSession(projectId: string): Promise<SessionRow | null> {
    return prisma.session.findFirst({
        where: {
            projectId,
            status: "active",
            endedAt: null,
        },
        orderBy: {
            startedAt: "desc",
        },
    });
}

export async function startSession(
    projectId: string,
    input: StartSessionInput,
): Promise<SessionRow> {
    return prisma.session.create({
        data: {
            projectId,
            title: input.title ?? null,
            agentName: input.agentName ?? null,
            status: "active",
            startedAt: new Date(),
        },
    });
}

export async function endSession(
    sessionId: string,
    summary?: string | null,
): Promise<SessionRow> {
    return prisma.session.update({
        where: { id: sessionId },
        data: {
            status: "completed",
            summary: summary ?? null,
            endedAt: new Date(),
        },
    });
}

export async function closeStaleSessions(projectId: string): Promise<number> {
    const result = await prisma.session.updateMany({
        where: {
            projectId,
            status: "active",
        },
        data: {
            status: "completed",
            endedAt: new Date(),
        },
    });

    return result.count;
}