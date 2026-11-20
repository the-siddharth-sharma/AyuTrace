import { PrismaClient } from "@prisma/client";

/**
 * AyuTrace Cloud PostgreSQL / Supabase Database Provider.
 * Loads connection configuration strictly from environment variables.
 * Never stores or exposes hardcoded credentials in source code.
 */
function getDatabaseUrl(): string {
  let envUrl = process.env.DATABASE_URL?.trim();

  // If DATABASE_URL is not set (e.g. during offline build or test runs),
  // use a safe local placeholder so PrismaClient instantiates without crashing module evaluation.
  if (!envUrl || (!envUrl.startsWith("postgres://") && !envUrl.startsWith("postgresql://"))) {
    return "postgresql://postgres:postgres@localhost:5432/postgres?connection_limit=1";
  }

  // Ensure connection limit is optimized for serverless PgBouncer pooler
  if (envUrl.includes("pgbouncer=true") && !envUrl.includes("connection_limit")) {
    envUrl += "&connection_limit=1";
  }

  return envUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
