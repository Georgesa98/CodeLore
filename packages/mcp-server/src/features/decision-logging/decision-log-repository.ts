import { prisma } from "@codelore/database";
import type {
    DecisionLogPayloadInput,
    DecisionLogRow,
    GetDecisionsInput,
} from "./types.ts";

export async function createDecisionLog(
    projectId: string,
    input: DecisionLogPayloadInput,
    sessionId?: string,
): Promise<DecisionLogRow> {
    return prisma.decision.create({
        data: {
            projectId,
            sessionId: sessionId ?? null,
            title: input.title,
            reasoning: input.reasoning,
            alternatives: input.alternatives ?? null,
            tradeoffs: input.tradeoffs ?? null,
            tags: input.tags ?? null,
        },
    });
}

export async function updateDecisionLog(
    projectId: string,
    decisionId: string,
    input: DecisionLogPayloadInput,
): Promise<DecisionLogRow | null> {
    const existing = await findDecisionLogById(projectId, decisionId);

    if (!existing) {
        return null;
    }

    return prisma.decision.update({
        where: {
            id: decisionId,
        },
        data: {
            title: input.title,
            reasoning: input.reasoning,
            alternatives: input.alternatives ?? null,
            tradeoffs: input.tradeoffs ?? null,
            tags: input.tags ?? null,
        },
    });
}

export async function listDecisionLogs(
    projectId: string,
    input: GetDecisionsInput = {},
): Promise<DecisionLogRow[]> {
    return prisma.decision.findMany({
        where: {
            projectId,
            ...(input.decisionId ? { id: input.decisionId } : {}),
        },
        orderBy: {
            createdAt: "desc",
        },
        take: input.limit,
    });
}

export async function findDecisionLogById(
    projectId: string,
    decisionId: string,
): Promise<DecisionLogRow | null> {
    return prisma.decision.findFirst({
        where: {
            id: decisionId,
            projectId,
        },
    });
}
