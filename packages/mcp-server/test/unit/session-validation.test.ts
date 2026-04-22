import { describe, expect, it } from "vitest";

import { ValidationError } from "../../src/shared/errors.ts";
import {
    parseEndSessionInput,
    parseStartSessionInput,
} from "../../src/features/session-management/validation.ts";

describe("features/session-management/validation", () => {
    it("parses and trims start session input", () => {
        const parsed = parseStartSessionInput({
            title: "  Sprint Planning  ",
            agentName: "  copilot  ",
        });

        expect(parsed).toEqual({
            title: "Sprint Planning",
            agentName: "copilot",
        });
    });

    it("accepts omitted optional start session fields", () => {
        const parsed = parseStartSessionInput({});

        expect(parsed).toEqual({});
    });

    it("throws ValidationError for invalid start session input", () => {
        expect(() => parseStartSessionInput({ title: 123 })).toThrow(
            ValidationError,
        );
    });

    it("parses and trims end session input", () => {
        const parsed = parseEndSessionInput({
            summary: "  shipped all tasks  ",
        });

        expect(parsed).toEqual({
            summary: "shipped all tasks",
        });
    });

    it("accepts omitted optional end session fields", () => {
        const parsed = parseEndSessionInput({});

        expect(parsed).toEqual({});
    });

    it("throws ValidationError for invalid end session input", () => {
        expect(() => parseEndSessionInput({ summary: 123 })).toThrow(
            ValidationError,
        );
    });
});
