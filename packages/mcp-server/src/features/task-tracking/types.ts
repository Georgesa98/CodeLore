export type TaskStatus = "pending" | "in_progress" | "done" | "blocked";

export type CreateTaskInput = {
    title: string;
    description: string | null;
    priority?: number;
    order?: number;
    parentId: string | null;
};

export type UpdateTaskInput = {
    taskId: string;
    status: TaskStatus;
};

export type TaskEntry = {
    taskId: string;
    title: string;
    description: string | null;
    priority: number;
    order: number;
    status: TaskStatus;
    parentId: string | null;
    createdAt: string;
    completedAt: string | null;
    subtasks: TaskEntry[];
};

export type CreateTaskResult = {
    taskId: string;
    status: TaskStatus;
};

export type UpdateTaskResult = {
    ok: boolean;
    taskId: string;
    newStatus: TaskStatus;
};

export type GetTasksResult = {
    tasks: TaskEntry[];
};
