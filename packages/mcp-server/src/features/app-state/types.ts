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
