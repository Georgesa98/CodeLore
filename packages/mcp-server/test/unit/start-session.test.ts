import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    parseStartSessionInputMock,
    closeStaleSessionsMock,
    startSessionMock,
    setActiveSessionIdMock,
} = vi.hoisted(() => ({
    parseStartSessionInputMock: vi.fn(),
    closeStaleSessionsMock: vi.fn(),
    startSessionMock: vi.fn(),
    setActiveSessionIdMock: vi.fn(),
}));

vi.mock("../../src/features/session-management/validation.ts", () => ({
    parseStartSessionInput: parseStartSessionInputMock,
}));

vi.mock("../../src/features/session-management/session-repository.ts", () => ({
    closeStaleSessions: closeStaleSessionsMock,
    startSession: startSessionMock,
}));

vi.mock("../../src/shared/context.ts", () => ({
    setActiveSessionId: setActiveSessionIdMock,
}));

import {
    start_session,
    startSessionInputShape,
    startSessionOutputShape,
} from "../../src/features/session-management/start-session.ts";

describe("features/session-management/start_session", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        parseStartSessionInputMock.mockReturnValue({
            title: "Sprint planning",
            agentName: "copilot",
        });

        closeStaleSessionsMock.mockResolvedValue(1);

        startSessionMock.mockResolvedValue({
            id: "session-1",
            projectId: "project-1",
            title: "Sprint planning",
            agentName: "copilot",
            status: "active",
            summary: null,
            startedAt: new Date("2026-04-22T10:00:00.000Z"),
            endedAt: null,
        });
    });

    it("exports tool shape constants", () => {
        expect(startSessionInputShape).toEqual({
            title: "string",
            agentName: "string",
        });

        expect(startSessionOutputShape).toEqual({
            sessionId: "string",
            projectId: "string",
            title: "string",
            agentName: "string",
            startedAt: "string",
            isNew: "boolean",
        });
    });

    it("starts a session and returns tool success content", async () => {
        const result = await start_session({ title: "x" }, "project-1");

        expect(parseStartSessionInputMock).toHaveBeenCalledWith({ title: "x" });
        expect(closeStaleSessionsMock).toHaveBeenCalledWith("project-1");
        expect(startSessionMock).toHaveBeenCalledWith("project-1", {
            title: "Sprint planning",
            agentName: "copilot",
        });
        expect(setActiveSessionIdMock).toHaveBeenCalledWith("session-1");

        expect(result).toEqual({
            structuredContent: {
                sessionId: "session-1",
                projectId: "project-1",
                title: "Sprint planning",
                agentName: "copilot",
                startedAt: "2026-04-22T10:00:00.000Z",
                isNew: true,
            },
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            sessionId: "session-1",
                            projectId: "project-1",
                            title: "Sprint planning",
                            agentName: "copilot",
                            startedAt: "2026-04-22T10:00:00.000Z",
                            isNew: true,
                        },
                        null,
                        2,
                    ),
                },
            ],
        });
    });

    it("normalizes nullable title and agentName to empty strings", async () => {
        startSessionMock.mockResolvedValue({
            id: "session-2",
            projectId: "project-1",
            title: null,
            agentName: null,
            status: "active",
            summary: null,
            startedAt: new Date("2026-04-22T11:00:00.000Z"),
            endedAt: null,
        });

        const result = await start_session({}, "project-1");

        expect(result).toEqual({
            structuredContent: {
                sessionId: "session-2",
                projectId: "project-1",
                title: "",
                agentName: "",
                startedAt: "2026-04-22T11:00:00.000Z",
                isNew: true,
            },
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            sessionId: "session-2",
                            projectId: "project-1",
                            title: "",
                            agentName: "",
                            startedAt: "2026-04-22T11:00:00.000Z",
                            isNew: true,
                        },
                        null,
                        2,
                    ),
                },
            ],
        });
    });

    it("returns tool error payload when dependencies throw", async () => {
        closeStaleSessionsMock.mockRejectedValue(new Error("db failure"));

        const result = await start_session({}, "project-1");

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "db failure" }],
        });
    });

    it("handles non-Error thrown values", async () => {
        parseStartSessionInputMock.mockImplementation(() => {
            throw "not-an-error";
        });

        const result = await start_session({}, "project-1");

        expect(result).toEqual({
            isError: true,
            content: [{ type: "text", text: "Unknown tool error" }],
        });
    });
});
