import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    parseGetAppStateInputMock,
    findAppStateBySectionMock,
    listAppStatesMock,
} = vi.hoisted(() => ({
    parseGetAppStateInputMock: vi.fn(),
    findAppStateBySectionMock: vi.fn(),
    listAppStatesMock: vi.fn(),
}));

vi.mock("../../src/features/app-state/validation.ts", () => ({
    parseGetAppStateInput: parseGetAppStateInputMock,
}));

vi.mock("../../src/features/app-state/app-state-repository.ts", () => ({
    findAppStateBySection: findAppStateBySectionMock,
    listAppStates: listAppStatesMock,
}));

import {
    get_app_state,
    getAppStateInputShape,
    getAppStateOutputShape,
} from "../../src/features/app-state/get-app-state.ts";

describe("features/app-state/get_app_state", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        parseGetAppStateInputMock.mockReturnValue({});
        listAppStatesMock.mockResolvedValue([
            {
                id: "state-1",
                projectId: "project-1",
                section: "architecture",
                content: "overview",
                updatedAt: new Date("2026-04-22T15:00:00.000Z"),
                updatedBy: "session-1",
            },
            {
                id: "state-2",
                projectId: "project-1",
                section: "database",
                content: "schema notes",
                updatedAt: new Date("2026-04-22T16:00:00.000Z"),
                updatedBy: null,
            },
        ]);
        findAppStateBySectionMock.mockResolvedValue(null);
    });

    it("exports tool shape constants", () => {
        expect(getAppStateInputShape).toEqual({
            section: "string",
        });

        expect(getAppStateOutputShape).toEqual({
            sections: "array",
        });
    });

    it("returns all sections when section filter is not provided", async () => {
        const result = await get_app_state({}, "project-1");

        expect(listAppStatesMock).toHaveBeenCalledWith("project-1");
        expect(findAppStateBySectionMock).not.toHaveBeenCalled();

        expect(result).toEqual({
            structuredContent: {
                sections: [
                    {
                        section: "architecture",
                        content: "overview",
                        updatedAt: "2026-04-22T15:00:00.000Z",
                        updatedBy: "session-1",
                    },
                    {
                        section: "database",
                        content: "schema notes",
                        updatedAt: "2026-04-22T16:00:00.000Z",
                        updatedBy: null,
                    },
                ],
            },
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            sections: [
                                {
                                    section: "architecture",
                                    content: "overview",
                                    updatedAt: "2026-04-22T15:00:00.000Z",
                                    updatedBy: "session-1",
                                },
                                {
                                    section: "database",
                                    content: "schema notes",
                                    updatedAt: "2026-04-22T16:00:00.000Z",
                                    updatedBy: null,
                                },
                            ],
                        },
                        null,
                        2,
                    ),
                },
            ],
        });
    });

    it("returns a specific section when section filter is provided", async () => {
        parseGetAppStateInputMock.mockReturnValue({ section: "architecture" });
        findAppStateBySectionMock.mockResolvedValue({
            id: "state-1",
            projectId: "project-1",
            section: "architecture",
            content: "overview",
            updatedAt: new Date("2026-04-22T15:00:00.000Z"),
            updatedBy: "session-1",
        });

        const result = await get_app_state(
            { section: "architecture" },
            "project-1",
        );

        expect(findAppStateBySectionMock).toHaveBeenCalledWith(
            "project-1",
            "architecture",
        );
        expect(listAppStatesMock).not.toHaveBeenCalled();

        expect(result).toEqual({
            structuredContent: {
                sections: [
                    {
                        section: "architecture",
                        content: "overview",
                        updatedAt: "2026-04-22T15:00:00.000Z",
                        updatedBy: "session-1",
                    },
                ],
            },
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            sections: [
                                {
                                    section: "architecture",
                                    content: "overview",
                                    updatedAt: "2026-04-22T15:00:00.000Z",
                                    updatedBy: "session-1",
                                },
                            ],
                        },
                        null,
                        2,
                    ),
                },
            ],
        });
    });

    it("returns an empty sections array when section is missing", async () => {
        parseGetAppStateInputMock.mockReturnValue({ section: "missing" });

        const result = await get_app_state({ section: "missing" }, "project-1");

        expect(result).toEqual({
            structuredContent: {
                sections: [],
            },
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            sections: [],
                        },
                        null,
                        2,
                    ),
                },
            ],
        });
    });

    it("returns tool error payload when dependencies throw", async () => {
        listAppStatesMock.mockRejectedValue(new Error("db failure"));

        const result = await get_app_state({}, "project-1");

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "db failure" }],
        });
    });

    it("handles non-Error thrown values", async () => {
        parseGetAppStateInputMock.mockImplementation(() => {
            throw "not-an-error";
        });

        const result = await get_app_state({}, "project-1");

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "Unknown tool error" }],
        });
    });
});
