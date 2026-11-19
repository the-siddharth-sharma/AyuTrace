import { PrismaClient } from "@prisma/client";

/**
 * AyuTrace Cloud PostgreSQL / Supabase Database Provider.
 * Automatically falls back to the configured Supabase transaction pooler
 * so Vercel builds and serverless execution succeed seamlessly even if
 * environment variables are still being configured in the Vercel Dashboard.
 */
const SUPABASE_DEFAULT_URL =
  "postgresql://postgres.kyxalzuunmejkuljtpcl:Siddarth%40161120@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

function getDatabaseUrl(): string {
  let envUrl = process.env.DATABASE_URL?.trim();

  // If a valid PostgreSQL/Supabase URL is provided, prioritize it
  if (!envUrl || (!envUrl.startsWith("postgres://") && !envUrl.startsWith("postgresql://"))) {
    envUrl = SUPABASE_DEFAULT_URL;
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
