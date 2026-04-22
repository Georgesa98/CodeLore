export type RuntimeContext = {
    activeProjectId?: string;
    activeSessionId?: string;
};

const runtimeContext: RuntimeContext = {};

export function getRuntimeContext() {
    return runtimeContext;
}

export function setActiveProjectId(projectId?: string) {
    runtimeContext.activeProjectId = projectId;
}

export function setActiveSessionId(sessionId?: string) {
    runtimeContext.activeSessionId = sessionId;
}
