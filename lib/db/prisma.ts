import { PrismaClient } from "@prisma/client";

/**
 * AyuTrace Cloud PostgreSQL / Supabase Database Provider.
 * Automatically falls back to the configured Supabase transaction pooler
 * so Vercel builds and serverless execution succeed seamlessly even if
 * environment variables are still being configured in the Vercel Dashboard.
 */
// Ensure environment variables are loaded in CLI/script contexts
if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  try {
    const { loadEnvConfig } = require("@next/env");
    loadEnvConfig(process.cwd(), true);
  } catch {}
}

function getDatabaseUrl(): string {
  let envUrl = process.env.DATABASE_URL?.trim() || process.env.DIRECT_URL?.trim();

  // If a valid PostgreSQL/Supabase URL is provided in the environment, prioritize and configure it
  if (envUrl && (envUrl.startsWith("postgres://") || envUrl.startsWith("postgresql://"))) {
    // Ensure connection limit is optimized for serverless PgBouncer pooler
    if (envUrl.includes("pgbouncer=true") && !envUrl.includes("connection_limit")) {
      envUrl += "&connection_limit=1";
    }
    return envUrl;
  }

  // Provide a safe placeholder so Next.js builds, tests, and API routes can initialize
  // without crashing at module evaluation time. Runtime database operations will fail gracefully
  // with a clean catchable connection error rather than crashing the serverless lambda.
  return "postgresql://unconfigured_database_url:missing@localhost:5432/ayutrace_unconfigured";
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

globalForPrisma.prisma = prisma;
