export type DecisionLogRow = {
    id: string;
    projectId: string;
    sessionId: string | null;
    title: string;
    reasoning: string;
    alternatives: string | null;
    tradeoffs: string | null;
    tags: string | null;
    createdAt: Date;
};

export type DecisionLogPayloadInput = {
    title: string;
    reasoning: string;
    alternatives: string | null;
    tradeoffs: string | null;
    tags: string | null;
};

export type LogDecisionInput = DecisionLogPayloadInput;

export type LogDecisionResult = {
    decisionId: string;
    title: string;
    createdAt: string;
};

export type UpdateDecisionLogInput = DecisionLogPayloadInput & {
    decisionId: string;
};

export type UpdateDecisionLogResult = {
    ok: boolean;
    decisionId: string;
    title: string;
};

export type GetDecisionsInput = {
    decisionId?: string;
    limit?: number;
};

export type DecisionEntry = {
    decisionId: string;
    title: string;
    reasoning: string;
    alternatives: string | null;
    tradeoffs: string | null;
    tags: string | null;
    createdAt: string;
    sessionId: string | null;
};

export type GetDecisionsResult = {
    decisions: DecisionEntry[];
};
