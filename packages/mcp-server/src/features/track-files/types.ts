export type FileChangeRow = {
    id: string;
    projectId: string;
    sessionId: string | null;
    filePath: string;
    changeType: string;
    summary: string | null;
    gitCommit: string | null;
    branch: string | null;
    createdAt: Date;
};

export type CreateFileChangeData = {
    filePath: string;
    changeType: string;
    summary: string | null;
    gitCommit: string | null;
    branch: string | null;
};

export type TrackFileChangeInput = {
    filePath: string;
    changeType: string;
    summary: string | null;
};

export type TrackFileChangeResult = {
    ok: boolean;
    filePath: string;
    gitCommit: string | null;
    branch: string | null;
};

export type GetFileChangesInput = {
    sessionId?: string;
    limit?: number;
};

export type FileChangeEntry = {
    id: string;
    filePath: string;
    changeType: string;
    summary: string | null;
    gitCommit: string | null;
    branch: string | null;
    createdAt: string;
    sessionId: string | null;
};

export type GetFileChangesResult = {
    changes: FileChangeEntry[];
};
