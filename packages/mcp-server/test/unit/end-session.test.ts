import { beforeEach, describe, expect, it, vi } from "vitest";

const { parseEndSessionInputMock, endSessionMock, setActiveSessionIdMock } =
    vi.hoisted(() => ({
        parseEndSessionInputMock: vi.fn(),
        endSessionMock: vi.fn(),
        setActiveSessionIdMock: vi.fn(),
    }));

vi.mock("../../src/features/session-management/validation.ts", () => ({
    parseEndSessionInput: parseEndSessionInputMock,
}));

vi.mock("../../src/features/session-management/session-repository.ts", () => ({
    endSession: endSessionMock,
}));

vi.mock("../../src/shared/context.ts", () => ({
    setActiveSessionId: setActiveSessionIdMock,
}));

import {
    end_session,
    endSessionInputShape,
    endSessionOutputShape,
} from "../../src/features/session-management/end-session.ts";

describe("features/session-management/end_session", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        parseEndSessionInputMock.mockReturnValue({
            summary: "Done",
        });

        endSessionMock.mockResolvedValue({
            id: "session-1",
            projectId: "project-1",
            title: "Sprint planning",
            agentName: "copilot",
            status: "completed",
            summary: "Done",
            startedAt: new Date("2026-04-22T10:00:00.000Z"),
            endedAt: new Date("2026-04-22T12:00:00.000Z"),
        });
    });

    it("exports tool shape constants", () => {
        expect(endSessionInputShape).toEqual({
            summary: "string",
        });

        expect(endSessionOutputShape).toEqual({
            sessionId: "string",
            status: "string",
            endedAt: "string",
        });
    });

    it("ends a session and returns tool success content", async () => {
        const result = await end_session({ summary: "Done" }, "session-1");

        expect(parseEndSessionInputMock).toHaveBeenCalledWith({
            summary: "Done",
        });
        expect(endSessionMock).toHaveBeenCalledWith("session-1", "Done");
        expect(setActiveSessionIdMock).toHaveBeenCalledWith(undefined);

        expect(result).toEqual({
            structuredContent: {
                sessionId: "session-1",
                status: "completed",
                endedAt: "2026-04-22T12:00:00.000Z",
            },
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            sessionId: "session-1",
                            status: "completed",
                            endedAt: "2026-04-22T12:00:00.000Z",
                        },
                        null,
                        2,
                    ),
                },
            ],
        });
    });

    it("passes null summary when not provided", async () => {
        parseEndSessionInputMock.mockReturnValue({});

        await end_session({}, "session-1");

        expect(endSessionMock).toHaveBeenCalledWith("session-1", null);
    });

    it("returns tool error payload when dependencies throw", async () => {
        endSessionMock.mockRejectedValue(new Error("db failure"));

        const result = await end_session({}, "session-1");

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "db failure" }],
        });
    });

    it("handles non-Error thrown values", async () => {
        parseEndSessionInputMock.mockImplementation(() => {
            throw "not-an-error";
        });

        const result = await end_session({}, "session-1");

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "Unknown tool error" }],
        });
    });
});
