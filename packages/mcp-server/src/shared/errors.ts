export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigurationError";
    }
}

export class ProjectDetectionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProjectDetectionError";
    }
}

import type { ToolErrorContent } from "./types.ts";

export function toToolErrorResult(error: unknown): ToolErrorContent {
    const message =
        error instanceof Error ? error.message : "Unknown tool error";

    return {
        isError: true,
        content: [
            {
                type: "text" as const,
                text: message,
            },
        ],
    };
}
