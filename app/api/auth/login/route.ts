import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { LoginSchema } from "@/lib/validations/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sanitizeUser } from "@/lib/auth/session";
import { getCachedUserByEmail, setCachedUser, getPreseededUserByEmail } from "@/lib/auth/user-cache";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid login credentials format",
          issues: result.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = result.data;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Instant RAM lookup (0.01 ms) if pre-warmed
    let user = getCachedUserByEmail(cleanEmail);

    // 2. If not yet in memory, query database with pre-seeded failover
    if (!user) {
      try {
        const userRows = await prisma.$queryRaw<
          Array<{
            id: string;
            email: string;
            name: string;
            passwordHash: string;
            role: string;
            licenseNumber: string | null;
            department: string | null;
            facilityId: string | null;
            createdAt: Date;
            facility_id: string | null;
            facility_name: string | null;
            facility_type: string | null;
            facility_city: string | null;
          }>
        >`
          SELECT u.id, u.email, u.name, u."passwordHash", u.role, u."licenseNumber", u.department, u."facilityId", u."createdAt",
                 f.id as facility_id, f.name as facility_name, f.type as facility_type, f.city as facility_city
          FROM "User" u
          LEFT JOIN "Facility" f ON u."facilityId" = f.id
          WHERE LOWER(u.email) = LOWER(${cleanEmail})
          LIMIT 1
        `;

        const row = userRows[0];
        if (row) {
          user = {
            id: row.id,
            email: row.email,
            name: row.name,
            passwordHash: row.passwordHash,
            role: row.role,
            licenseNumber: row.licenseNumber,
            department: row.department,
            facilityId: row.facilityId,
            createdAt: row.createdAt,
            facility: row.facility_id
              ? {
                  id: row.facility_id,
                  name: row.facility_name!,
                  type: row.facility_type!,
                  city: row.facility_city,
                }
              : null,
          };
          setCachedUser(user);
        }
      } catch (dbErr: any) {
        console.warn("[Auth Warning] Database lookup failed, falling back to pre-seeded clinical records:", dbErr?.message);
        user = getPreseededUserByEmail(cleanEmail);
        if (!user) {
          throw dbErr;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password. Please verify your credentials.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password. Please verify your credentials.",
        },
        { status: 401 }
      );
    }

    // Create session and prime memory cache immediately
    await createSession(user, rememberMe);

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    console.error("Login error:", error?.message || error);
    const isDbAuthError =
      error?.message?.includes("Authentication failed") ||
      error?.message?.includes("credentials for `postgres` are not valid");

    const isDbError =
      isDbAuthError ||
      error?.message?.includes("database") ||
      error?.message?.includes("datasource") ||
      error?.message?.includes("protocol") ||
      error?.message?.includes("connection");

    let friendlyError = "Internal server error occurred during login. Please try again.";
    if (isDbAuthError) {
      friendlyError =
        "Database authentication failed. Please update DATABASE_URL with your new Supabase database password in .env and Vercel project settings.";
    } else if (isDbError) {
      friendlyError =
        "Database connection error. Please verify Vercel environment integration (DATABASE_URL).";
    }

    return NextResponse.json(
      {
        success: false,
        error: friendlyError,
        details: process.env.NODE_ENV !== "production" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
