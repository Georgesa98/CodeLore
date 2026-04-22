export type ToolErrorContent = {
    isError: true;
    content: Array<{ type: "text"; text: string }>;
};

export type ToolSuccessContent<T> = {
    structuredContent: T;
    content: Array<{ type: "text"; text: string }>;
};

export type ToolResult<T = unknown> = ToolErrorContent | ToolSuccessContent<T>;
