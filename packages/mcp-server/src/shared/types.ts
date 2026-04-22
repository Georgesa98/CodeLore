export type DetectProjectResult = {
    projectId: string;
    name: string;
    repoPath: string;
    isNew: boolean;
};

export type ToolErrorContent = {
    isError: true;
    content: Array<{ type: "text"; text: string }>;
};

export type ToolSuccessContent<T> = {
    structuredContent: T;
    content: Array<{ type: "text"; text: string }>;
};

export type ToolResult<T = DetectProjectResult> = ToolErrorContent | ToolSuccessContent<T>;
