import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "./generated/prisma/client.ts";
import { resolveDatabaseUrl } from "./database-url.ts";

const adapter = new PrismaBetterSqlite3({
    url: resolveDatabaseUrl(),
});

export const prisma = new PrismaClient({ adapter });
