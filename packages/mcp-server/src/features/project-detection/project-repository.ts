import { prisma } from "@codelore/database";

type ProjectRow = {
    id: string;
    name: string;
    repoPath: string;
};

export async function findProjectByRepoPath(repoPath: string) {
    return prisma.project.findUnique({
        where: { repoPath },
        select: {
            id: true,
            name: true,
            repoPath: true,
        },
    });
}

export async function createProject(data: {
    name: string;
    repoPath: string;
}): Promise<ProjectRow> {
    return prisma.project.upsert({
        where: { repoPath: data.repoPath },
        create: {
            name: data.name,
            repoPath: data.repoPath,
        },
        update: {},
        select: {
            id: true,
            name: true,
            repoPath: true,
        },
    });
}
