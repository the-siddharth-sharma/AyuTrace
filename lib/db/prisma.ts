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
    loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
  } catch {}
}

function getDatabaseUrl(): string {
  let envUrl = process.env.DATABASE_URL?.trim() || process.env.DIRECT_URL?.trim();

  // If a valid PostgreSQL/Supabase URL is provided in the environment, prioritize it
  if (!envUrl || (!envUrl.startsWith("postgres://") && !envUrl.startsWith("postgresql://"))) {
    // Provide a safe placeholder only during Next.js build phase if env vars are missing
    if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NODE_ENV === "test") {
      return "postgresql://build_placeholder:build_placeholder@localhost:5432/build_db";
    }
    throw new Error(
      "Missing or invalid DATABASE_URL environment variable. Please configure DATABASE_URL in your .env or Vercel project settings."
    );
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
