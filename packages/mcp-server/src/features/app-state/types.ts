export type AppStateSection = {
    section: string;
    content: string;
    updatedAt: string;
    updatedBy: string | null;
};

export type UpdateAppStateResult = {
    ok: boolean;
    section: string;
    updatedAt: string;
    updatedBy: string | null;
};

export type GetAppStateResult = {
    sections: AppStateSection[];
};

export type AppStateRow = {
    id: string;
    projectId: string;
    section: string;
    content: string;
    updatedAt: Date;
    updatedBy: string | null;
};

export type UpsertAppStateInput = {
    section: string;
    content: string;
};
