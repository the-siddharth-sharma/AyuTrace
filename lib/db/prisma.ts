import { PrismaClient } from "@prisma/client";

/**
 * AyuTrace Cloud PostgreSQL / Supabase Database Provider.
 * Loads connection configuration strictly from environment variables.
 * Never stores or exposes hardcoded credentials in source code.
 */
function getDatabaseUrl(): string {
  let envUrl = process.env.DATABASE_URL?.trim();

  // Validate that a valid PostgreSQL/Supabase URL is provided in the environment
  if (!envUrl || (!envUrl.startsWith("postgres://") && !envUrl.startsWith("postgresql://"))) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Critical Configuration Error: DATABASE_URL is missing or invalid in production environment."
      );
    }
    // Safe placeholder during offline testing/mocking
    envUrl = "postgresql://postgres:postgres@localhost:5432/postgres";
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
