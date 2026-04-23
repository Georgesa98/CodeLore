import { prisma } from "@codelore/database";
import type {
    CreateTaskInput,
    UpdateTaskInput,
    TaskEntry,
    TaskStatus,
} from "./types.ts";

function mapToTaskEntry(row: any): TaskEntry {
    return {
        taskId: row.id,
        title: row.title,
        description: row.description,
        priority: row.priority,
        order: row.order,
        status: row.status as TaskStatus,
        parentId: row.parentId,
        createdAt: row.createdAt.toISOString(),
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
        subtasks: (row.subtasks || []).map(mapToTaskEntry),
    };
}

export async function createTask(
    projectId: string,
    sessionId: string | null,
    input: CreateTaskInput,
): Promise<TaskEntry> {
    if (input.parentId) {
        const parent = await prisma.task.findFirst({
            where: { id: input.parentId, projectId },
        });
        if (!parent) {
            throw new Error(
                "Invalid parentId. Parent task not found in this project.",
            );
        }
    }

    const task = await prisma.task.create({
        data: {
            projectId,
            sessionId,
            title: input.title,
            description: input.description ?? null,
            priority: input.priority ?? 0,
            order: input.order ?? 0,
            parentId: input.parentId ?? null,
        },
    });

    return mapToTaskEntry(task);
}

export async function updateTask(
    projectId: string,
    input: UpdateTaskInput,
): Promise<TaskEntry | null> {
    const existing = await prisma.task.findFirst({
        where: { id: input.taskId, projectId },
    });

    if (!existing) {
        return null;
    }

    const updateData: any = { status: input.status };

    if (input.status === "done") {
        updateData.completedAt = new Date();
    } else {
        updateData.completedAt = null;
    }

    const updated = await prisma.task.update({
        where: { id: input.taskId },
        data: updateData,
    });

    return mapToTaskEntry(updated);
}

export async function listTasksBySession(
    projectId: string,
    sessionId: string,
): Promise<TaskEntry[]> {
    const rows = await prisma.task.findMany({
        where: {
            projectId,
            sessionId,
            parentId: null,
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
            subtasks: {
                orderBy: [{ order: "asc" }, { createdAt: "asc" }],
                include: {
                    subtasks: true,
                },
            },
        },
    });

    return rows.map(mapToTaskEntry);
}
