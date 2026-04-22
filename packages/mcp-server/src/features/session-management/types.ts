export type StartSessionResult = {
    sessionId: string;
    projectId: string;
    title: string;
    agentName: string;
    startedAt: string;
    isNew: boolean;
};

export type EndSessionResult = {
    sessionId: string;
    status: string;
    endedAt: string;
};
