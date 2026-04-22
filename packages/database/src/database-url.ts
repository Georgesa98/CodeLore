export function resolveDatabaseUrl() {
    return (
        process.env.DATABASE_URL ??
        new URL("../prisma/dev.db", import.meta.url).href
    );
}
