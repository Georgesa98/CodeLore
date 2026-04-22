import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    ConfigurationError,
    ProjectDetectionError,
    ValidationError,
    toToolErrorResult,
} from "../../src/shared/errors.ts";
import { getRuntimeContext } from "../../src/shared/context.ts";
import { parseDetectProjectInput } from "../../src/shared/validation.ts";
import {
    getProjectNameFromRepoPath,
    normalizeRepoPath,
} from "../../src/utils/path-resolver.ts";

describe("shared/validation", () => {
    it("parses valid input and trims cwd", () => {
        const parsed = parseDetectProjectInput({ cwd: "  /tmp/repo  " });

        expect(parsed).toEqual({ cwd: "/tmp/repo" });
    });

    it("throws ValidationError when cwd is empty", () => {
        expect(() => parseDetectProjectInput({ cwd: "   " })).toThrow(
            ValidationError,
        );
    });

    it("throws ValidationError when cwd is missing", () => {
        expect(() => parseDetectProjectInput({})).toThrow(ValidationError);
    });

    it("throws ValidationError when cwd is not a string", () => {
        expect(() => parseDetectProjectInput({ cwd: 42 })).toThrow(
            ValidationError,
        );
    });
});

describe("shared/errors", () => {
    it("formats Error instances into tool errors", () => {
        const result = toToolErrorResult(new Error("boom"));

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "boom" }],
        });
    });

    it("formats unknown thrown values into a fallback message", () => {
        const result = toToolErrorResult("not-an-error");

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "Unknown tool error" }],
        });
    });

    it("sets class names on custom error types", () => {
        expect(new ValidationError("x").name).toBe("ValidationError");
        expect(new ConfigurationError("x").name).toBe("ConfigurationError");
        expect(new ProjectDetectionError("x").name).toBe(
            "ProjectDetectionError",
        );
    });
});

describe("utils/path-resolver", () => {
    it("normalizes relative paths to absolute forward-slash form", () => {
        const normalized = normalizeRepoPath("./test/../repo");

        expect(path.isAbsolute(normalized)).toBe(true);
        expect(normalized.includes("\\")).toBe(false);
    });

    it("replaces backslashes with forward slashes", () => {
        const normalized = normalizeRepoPath("/tmp/codelore\\repo");

        expect(normalized).toContain("/tmp/codelore/repo");
        expect(normalized.includes("\\")).toBe(false);
    });

    it("derives project name from repo path", () => {
        expect(getProjectNameFromRepoPath("/tmp/codelore-repo")).toBe(
            "codelore-repo",
        );
    });

    it("throws when project name cannot be derived", () => {
        expect(() => getProjectNameFromRepoPath("/")).toThrow(ValidationError);
    });
});

describe("shared/context", () => {
    it("returns a stable mutable runtime context object", () => {
        const first = getRuntimeContext();
        const second = getRuntimeContext();

        first.activeProjectId = "project-123";

        expect(second).toBe(first);
        expect(second.activeProjectId).toBe("project-123");
    });
});
