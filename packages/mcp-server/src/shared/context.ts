type RuntimeContext = {
    activeProjectId?: string;
    activeSessionId?: string;
};

const runtimeContext: RuntimeContext = {};

export function getRuntimeContext() {
    return runtimeContext;
}
