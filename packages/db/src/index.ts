import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

// Singleton to avoid exhausting Postgres connections during dev hot-reload.
// ponytail: global cache keyed on a symbol — fine for single-process apps; if we
// ever shard the API into many workers, move pooling to PgBouncer.
const globalForPrisma = globalThis as unknown as { __cynexPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__cynexPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__cynexPrisma = prisma;
