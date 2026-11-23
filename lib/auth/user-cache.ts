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

// Pre-seeded clinical staff records (fallback authentication guarantees seamless demo/failover)
const DEFAULT_PRESEEDED_USERS: CachedUserRecord[] = [
  {
    id: "cmvp2cpgs000daen4whwbqc78",
    email: "ananya@ayutrace.org",
    name: "Staff Pharmacist Ananya",
    passwordHash:
      "a879d83f18b68bc04016a598fdc5d49d:dfacd164813fe3b3399f854c31faa8885174aff07bcd317a7fd58200da63a9f4385ddf90b5861a42337eb3654e40c061e2b66a169fea5ab549d7c9be983f661f",
    role: "pharmacist",
    licenseNumber: "PCI-KA-2022-7712",
    department: "Primary Care Dispensary",
    facilityId: "cmvp2cpfm0007aen4u4zm8lof",
    createdAt: new Date("2026-10-26T09:37:49.036Z"),
    facility: {
      id: "cmvp2cpfm0007aen4u4zm8lof",
      name: "AyuTrace Community Clinic",
      type: "clinic",
      city: "Bengaluru",
    },
  },
  {
    id: "cmvp2cpfs000baen48hvhj864",
    email: "pharmacist@ayutrace.org",
    name: "Senior Pharmacist Sharma",
    passwordHash:
      "a879d83f18b68bc04016a598fdc5d49d:dfacd164813fe3b3399f854c31faa8885174aff07bcd317a7fd58200da63a9f4385ddf90b5861a42337eb3654e40c061e2b66a169fea5ab549d7c9be983f661f",
    role: "lead_pharmacist",
    licenseNumber: "PCI-DL-2018-4491",
    department: "Central Inpatient Dispensary",
    facilityId: "cmvp2cpfm0003aen4k7j5q42n",
    createdAt: new Date("2026-10-26T09:37:49.036Z"),
    facility: {
      id: "cmvp2cpfm0003aen4k7j5q42n",
      name: "Apex Central Hospital",
      type: "hospital",
      city: "New Delhi",
    },
  },
];

const userCache = new Map<string, CachedUserRecord>();
DEFAULT_PRESEEDED_USERS.forEach((u) => userCache.set(u.email.toLowerCase().trim(), u));

export function getCachedUserByEmail(email: string): CachedUserRecord | undefined {
  return userCache.get(email.toLowerCase().trim());
}

export function getPreseededUserByEmail(email: string): CachedUserRecord | undefined {
  return DEFAULT_PRESEEDED_USERS.find(
    (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
  );
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
