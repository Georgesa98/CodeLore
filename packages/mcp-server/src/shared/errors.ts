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

export function toToolErrorResult(error: unknown) {
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
