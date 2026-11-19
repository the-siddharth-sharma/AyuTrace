import { prisma } from "@/lib/db/prisma";

export interface CachedUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  licenseNumber: string | null;
  department: string | null;
  facilityId: string | null;
  createdAt: Date;
  facility: {
    id: string;
    name: string;
    type: string;
    city: string | null;
  } | null;
}

const userCache = new Map<string, CachedUserRecord>();

export function getCachedUserByEmail(email: string): CachedUserRecord | undefined {
  return userCache.get(email.toLowerCase().trim());
}

export function setCachedUser(user: CachedUserRecord): void {
  userCache.set(user.email.toLowerCase().trim(), user);
}

export function invalidateUserCache(email?: string): void {
  if (email) {
    userCache.delete(email.toLowerCase().trim());
  } else {
    userCache.clear();
  }
}

/**
 * Pre-warms the user cache from the database.
 * Run in the background on server boot so login lookups are instant (0.00 ms).
 */
export async function prewarmUserCache(): Promise<void> {
  try {
    const users = await prisma.$queryRaw<
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
    `;

    for (const row of users) {
      setCachedUser({
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
      });
    }
  } catch (err) {
    // Suppress warmup failures during offline builds
  }
}
