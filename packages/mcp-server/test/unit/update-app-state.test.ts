import { beforeEach, describe, expect, it, vi } from "vitest";

const { parseUpdateAppStateInputMock, upsertAppStateMock } = vi.hoisted(() => ({
    parseUpdateAppStateInputMock: vi.fn(),
    upsertAppStateMock: vi.fn(),
}));

vi.mock("../../src/features/app-state/validation.ts", () => ({
    parseUpdateAppStateInput: parseUpdateAppStateInputMock,
}));

vi.mock("../../src/features/app-state/app-state-repository.ts", () => ({
    upsertAppState: upsertAppStateMock,
}));

import {
    update_app_state,
    updateAppStateInputShape,
    updateAppStateOutputShape,
} from "../../src/features/app-state/update-app-state.ts";

describe("features/app-state/update_app_state", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        parseUpdateAppStateInputMock.mockReturnValue({
            section: "architecture",
            content: "# Architecture\nService map",
        });

        upsertAppStateMock.mockResolvedValue({
            id: "state-1",
            projectId: "project-1",
            section: "architecture",
            content: "# Architecture\nService map",
            updatedAt: new Date("2026-04-22T15:00:00.000Z"),
            updatedBy: "session-1",
        });
    });

    it("exports tool shape constants", () => {
        expect(updateAppStateInputShape).toEqual({
            section: "string",
            content: "string",
        });

        expect(updateAppStateOutputShape).toEqual({
            ok: "boolean",
            section: "string",
            updatedAt: "string",
            updatedBy: "string | null",
        });
    });

    it("upserts app state and returns tool success content", async () => {
        const result = await update_app_state(
            { section: "architecture", content: "x" },
            "project-1",
            "session-1",
        );

        expect(parseUpdateAppStateInputMock).toHaveBeenCalledWith({
            section: "architecture",
            content: "x",
        });
        expect(upsertAppStateMock).toHaveBeenCalledWith(
            "project-1",
            "session-1",
            {
                section: "architecture",
                content: "# Architecture\nService map",
            },
        );

        expect(result).toEqual({
            structuredContent: {
                ok: true,
                section: "architecture",
                updatedAt: "2026-04-22T15:00:00.000Z",
                updatedBy: "session-1",
            },
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            ok: true,
                            section: "architecture",
                            updatedAt: "2026-04-22T15:00:00.000Z",
                            updatedBy: "session-1",
                        },
                        null,
                        2,
                    ),
                },
            ],
        });
    });

    it("returns tool error payload when dependencies throw", async () => {
        upsertAppStateMock.mockRejectedValue(new Error("db failure"));

        const result = await update_app_state({}, "project-1", "session-1");

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "db failure" }],
        });
    });

    it("handles non-Error thrown values", async () => {
        parseUpdateAppStateInputMock.mockImplementation(() => {
            throw "not-an-error";
        });

        const result = await update_app_state({}, "project-1", "session-1");

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "Unknown tool error" }],
        });
    });
});
