import { describe, expect, it } from "vitest";

import { ValidationError } from "../../src/shared/errors.ts";
import {
    parseGetAppStateInput,
    parseUpdateAppStateInput,
} from "../../src/features/app-state/validation.ts";

describe("features/app-state/validation", () => {
    it("parses and trims update app-state input", () => {
        const parsed = parseUpdateAppStateInput({
            section: "  architecture  ",
            content: "  markdown body  ",
        });

        expect(parsed).toEqual({
            section: "architecture",
            content: "markdown body",
        });
    });

    it("throws ValidationError when update section is empty", () => {
        expect(() =>
            parseUpdateAppStateInput({ section: "   ", content: "x" }),
        ).toThrow(ValidationError);
    });

    it("throws ValidationError when update content is empty", () => {
        expect(() =>
            parseUpdateAppStateInput({
                section: "architecture",
                content: "   ",
            }),
        ).toThrow(ValidationError);
    });

    it("parses get_app_state input with optional section", () => {
        expect(parseGetAppStateInput({})).toEqual({});
        expect(parseGetAppStateInput({ section: "  database  " })).toEqual({
            section: "database",
        });
    });

    it("throws ValidationError for invalid get_app_state section type", () => {
        expect(() => parseGetAppStateInput({ section: 123 })).toThrow(
            ValidationError,
        );
    });

    it("throws ValidationError for empty get_app_state section", () => {
        expect(() => parseGetAppStateInput({ section: "   " })).toThrow(
            ValidationError,
        );
    });
});
