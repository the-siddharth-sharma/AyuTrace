import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { AUTH_COOKIE_NAME } from "./constants";

export { AUTH_COOKIE_NAME };

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  licenseNumber: string | null;
  department: string | null;
  facilityId: string | null;
  facility?: {
    id: string;
    name: string;
    type: string;
    city: string | null;
  } | null;
  createdAt: Date;
}

export function sanitizeUser(user: any): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    licenseNumber: user.licenseNumber ?? null,
    department: user.department ?? null,
    facilityId: user.facilityId ?? null,
    facility: user.facility
      ? {
          id: user.facility.id,
          name: user.facility.name,
          type: user.facility.type,
          city: user.facility.city,
        }
      : null,
    createdAt: user.createdAt,
  };
}

interface CachedSession {
  user: SafeUser;
  expiresAt: number;
}

const sessionMemoryCache = new Map<string, CachedSession>();

const SESSION_HMAC_SECRET =
  process.env.SESSION_SECRET ||
  process.env.AUTH_SECRET ||
  "ayutrace-statutory-gamp5-session-signing-secret-2026";

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 * Enables zero-latency stateless verification across independent Vercel serverless functions.
 */
export function signToken(user: SafeUser, expiresAt: Date): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payloadObj = {
    ...sanitizeUser(user),
    exp: expiresAt.getTime(),
    nonce,
  };
  const b64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const hmac = crypto.createHmac("sha256", SESSION_HMAC_SECRET);
  hmac.update(b64Payload);
  const signature = hmac.digest("base64url");
  return `${b64Payload}.${signature}`;
}

/**
 * Verifies and decodes a signed session token without requiring a database query.
 */
export function verifySignedToken(token: string): SafeUser | null {
  try {
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return null;
    const b64Payload = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    const hmac = crypto.createHmac("sha256", SESSION_HMAC_SECRET);
    hmac.update(b64Payload);
    const expectedSignature = hmac.digest("base64url");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const payloadStr = Buffer.from(b64Payload, "base64url").toString("utf-8");
    const data = JSON.parse(payloadStr);

    if (data.exp && Date.now() > data.exp) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      licenseNumber: data.licenseNumber ?? null,
      department: data.department ?? null,
      facilityId: data.facilityId ?? null,
      facility: data.facility ?? null,
      createdAt: new Date(data.createdAt || Date.now()),
    };
  } catch {
    return null;
  }
}

export function setCachedSession(token: string, user: SafeUser, expiresAt: Date) {
  sessionMemoryCache.set(token, {
    user,
    expiresAt: expiresAt.getTime(),
  });
}

export function clearCachedSession(token?: string) {
  if (token) {
    sessionMemoryCache.delete(token);
  } else {
    sessionMemoryCache.clear();
  }
}

/**
 * Creates a new session in the database and sets the session cookie.
 * Immediately primes the in-memory cache to make subsequent layout renders instant.
 */
export async function createSession(
  userOrId: string | any,
  rememberMe = true
): Promise<string> {
  const durationMs = (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + durationMs);

  const safeUser =
    typeof userOrId === "object" && userOrId !== null ? sanitizeUser(userOrId) : null;
  const userId = safeUser ? safeUser.id : userOrId;

  // Generate self-contained signed HMAC token when user object is available
  const token = safeUser
    ? signToken(safeUser, expiresAt)
    : crypto.randomBytes(32).toString("hex");

  // Prime the in-memory cache immediately so layout authentication doesn't hit DB
  if (safeUser) {
    setCachedSession(token, safeUser, expiresAt);
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  // Persist session to PostgreSQL synchronously if database is connected.
  // If the database is temporarily unreachable or undergoing credential rotation,
  // the in-memory cache and signed cookie ensure the clinician's login remains seamless.
  try {
    await prisma.session.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  } catch (err: any) {
    console.warn(
      "[Session Warning] Could not persist session to PostgreSQL database, relying on authenticated cookie & RAM cache:",
      err?.message
    );
  }

  return token;
}

/**
 * Destroys the current user session in the DB and removes the cookie.
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      clearCachedSession(token);
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    cookieStore.delete(AUTH_COOKIE_NAME);
  } catch (error) {
    console.error("Error destroying session:", error);
  }
}

/**
 * Retrieves the currently logged in user based on the active session cookie.
 * Checks the ultra-fast in-memory cache first (0.01 ms) before falling back to DB.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;

    // 1. Fast in-memory cache lookup
    const cached = sessionMemoryCache.get(token);
    const now = Date.now();
    if (cached) {
      if (cached.expiresAt > now) {
        return cached.user;
      }
      sessionMemoryCache.delete(token);
    }

    // 2. Stateless cryptographic token verification (enables zero-latency verification across independent Vercel lambdas)
    const verifiedUser = verifySignedToken(token);
    if (verifiedUser) {
      setCachedSession(token, verifiedUser, new Date(now + 30 * 24 * 60 * 60 * 1000));
      return verifiedUser;
    }

    // 3. Fallback: Single-query SQL JOIN for legacy hex sessions in DB
    const rows = await prisma.$queryRaw<
      Array<{
        session_id: string;
        session_expiresAt: Date;
        user_id: string;
        user_email: string;
        user_name: string;
        user_role: string;
        user_licenseNumber: string | null;
        user_department: string | null;
        user_facilityId: string | null;
        user_createdAt: Date;
        facility_id: string | null;
        facility_name: string | null;
        facility_type: string | null;
        facility_city: string | null;
      }>
    >`
      SELECT s.id as session_id, s."expiresAt" as "session_expiresAt",
             u.id as user_id, u.email as user_email, u.name as user_name, u.role as user_role,
             u."licenseNumber" as "user_licenseNumber", u.department as "user_department",
             u."facilityId" as "user_facilityId", u."createdAt" as "user_createdAt",
             f.id as facility_id, f.name as facility_name, f.type as facility_type, f.city as facility_city
      FROM "Session" s
      JOIN "User" u ON s."userId" = u.id
      LEFT JOIN "Facility" f ON u."facilityId" = f.id
      WHERE s.token = ${token}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) return null;

    // Check if session expired
    if (new Date(row.session_expiresAt) < new Date()) {
      await prisma.session.delete({ where: { id: row.session_id } }).catch(() => {});
      cookieStore.delete(AUTH_COOKIE_NAME);
      return null;
    }

    const safeUser: SafeUser = {
      id: row.user_id,
      email: row.user_email,
      name: row.user_name,
      role: row.user_role,
      licenseNumber: row.user_licenseNumber,
      department: row.user_department,
      facilityId: row.user_facilityId,
      facility: row.facility_id
        ? {
            id: row.facility_id,
            name: row.facility_name!,
            type: row.facility_type!,
            city: row.facility_city,
          }
        : null,
      createdAt: row.user_createdAt,
    };

    setCachedSession(token, safeUser, row.session_expiresAt);
    return safeUser;
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}
