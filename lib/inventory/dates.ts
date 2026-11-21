import { differenceInCalendarDays, parseISO, isValid, format, lastDayOfMonth } from "date-fns";

export interface MedicineExpiryEvaluation {
  daysRemaining: number | null;
  status: "expired" | "urgent" | "critical" | "near_expiry" | "valid" | "unverified";
  label: string;
  badgeVariant: "destructive" | "warning" | "alert" | "success" | "neutral";
  isDispensingBlocked: boolean;
  policyNotes: string;
  categoryTier: "valid_year" | "safe_shelf" | "near_expiry_6m" | "critical_1m" | "expired" | "unverified";
  categoryLabel: string;
  categoryColor: string;
}

/**
 * Deterministically evaluate medicine batch expiry risk based on calendar days.
 * Updated Statutory & Clinical Thresholds:
 * - Valid in stock (≥ 1 Year): Dark green (#00594C), full statutory shelf-life (≥365 days).
 * - Safe shelf (6–12 Months): Safe inventory standing (180–364 days).
 * - Near expiry (≤ 6 Months): Yellow (#EAB308), priority rotation window (31–180 days).
 * - Critical / Urgent (≤ 1 Month): Red (#DC2626), expedited dispatch cutoff (≤30 days).
 * - Expired: Past cutoff (<0 days), blocked from dispensing and quarantined.
 */
export function evaluateMedicineExpiry(
  date: Date | string | null | undefined,
  verifiedByStaff: boolean = true,
  nearDays: number = 180,
  criticalDays: number = 30,
  urgentDays: number = 7,
  validYearDays: number = 365
): MedicineExpiryEvaluation {
  if (!verifiedByStaff) {
    return {
      daysRemaining: null,
      status: "unverified",
      label: "Pending Verification",
      badgeVariant: "neutral",
      isDispensingBlocked: true,
      policyNotes: "Medicine batch requires staff pharmacist verification before clinical release.",
      categoryTier: "unverified",
      categoryLabel: "Pending Verification",
      categoryColor: "#64748B",
    };
  }

  if (!date) {
    return {
      daysRemaining: null,
      status: "unverified",
      label: "Expiry Date Missing",
      badgeVariant: "destructive",
      isDispensingBlocked: true,
      policyNotes: "Unrecorded expiry date. Ineligible for dispensing until verified from packaging label.",
      categoryTier: "unverified",
      categoryLabel: "Expiry Missing",
      categoryColor: "#DC2626",
    };
  }

  const targetDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(targetDate)) {
    return {
      daysRemaining: null,
      status: "unverified",
      label: "Invalid Date Format",
      badgeVariant: "destructive",
      isDispensingBlocked: true,
      policyNotes: "Unparseable expiry date string. Audit required.",
      categoryTier: "unverified",
      categoryLabel: "Invalid Format",
      categoryColor: "#DC2626",
    };
  }

  const now = new Date();
  const daysRemaining = differenceInCalendarDays(targetDate, now);

  if (daysRemaining < 0) {
    const elapsed = Math.abs(daysRemaining);
    return {
      daysRemaining,
      status: "expired",
      label: `Expired (${elapsed}d ago)`,
      badgeVariant: "destructive",
      isDispensingBlocked: true,
      policyNotes: "Past printed expiration cutoff. Must be quarantined for safe destruction or supplier return.",
      categoryTier: "expired",
      categoryLabel: "Expired",
      categoryColor: "#DC2626",
    };
  }

  if (daysRemaining <= urgentDays) {
    return {
      daysRemaining,
      status: "urgent",
      label: daysRemaining === 0 ? "Expires Today" : `Expires in ${daysRemaining}d`,
      badgeVariant: "destructive",
      isDispensingBlocked: true,
      policyNotes: "Within urgent cutoff (≤7 days). Do not dispense for courses exceeding remaining duration.",
      categoryTier: "critical_1m",
      categoryLabel: "Urgent (≤7d)",
      categoryColor: "#DC2626",
    };
  }

  if (daysRemaining <= criticalDays) {
    return {
      daysRemaining,
      status: "critical",
      label: `Critical (${daysRemaining}d left)`,
      badgeVariant: "warning",
      isDispensingBlocked: false,
      policyNotes: "Priority rotation required. 1 month or less remaining until expiration.",
      categoryTier: "critical_1m",
      categoryLabel: "Critical (≤1 Month)",
      categoryColor: "#DC2626",
    };
  }

  if (daysRemaining <= nearDays) {
    return {
      daysRemaining,
      status: "near_expiry",
      label: `Near Expiry (${daysRemaining}d)`,
      badgeVariant: "alert",
      isDispensingBlocked: false,
      policyNotes: "Within 6-month near-expiry timeline. Front-load in FEFO dispensing schedule.",
      categoryTier: "near_expiry_6m",
      categoryLabel: "Near Expiry (≤6 Months)",
      categoryColor: "#EAB308",
    };
  }

  if (daysRemaining < validYearDays) {
    const months = Math.round(daysRemaining / 30);
    return {
      daysRemaining,
      status: "valid",
      label: `Safe (${months}mo left)`,
      badgeVariant: "success",
      isDispensingBlocked: false,
      policyNotes: "Safe shelf-life in standard standing (6 to 12 months remaining).",
      categoryTier: "safe_shelf",
      categoryLabel: "Safe (6–12 Months)",
      categoryColor: "#2DD4BF",
    };
  }

  return {
    daysRemaining,
    status: "valid",
    label: `Valid (≥1 yr)`,
    badgeVariant: "success",
    isDispensingBlocked: false,
    policyNotes: "Batch is in prime standing with at least 1 year shelf-life remaining.",
    categoryTier: "valid_year",
    categoryLabel: "Valid (≥1 Year)",
    categoryColor: "#00594C",
  };
}

/**
 * Returns UI badge styling and metadata for real-time stock expiry classification.
 */
export function getExpiryCategoryBadge(daysRemaining: number | null, verified: boolean = true) {
  if (!verified || daysRemaining === null) {
    return {
      tier: "unverified" as const,
      label: "Pending Verification",
      sublabel: "Verification required",
      color: "#64748B",
      bgClass: "bg-slate-100 text-slate-700 border-slate-300",
      dotClass: "bg-slate-500",
    };
  }
  if (daysRemaining < 0) {
    return {
      tier: "expired" as const,
      label: "Expired (Quarantine)",
      sublabel: `Expired ${Math.abs(daysRemaining)}d ago`,
      color: "#DC2626",
      bgClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
      dotClass: "bg-rose-600",
    };
  }
  if (daysRemaining <= 30) {
    return {
      tier: "critical_1m" as const,
      label: "Critical (≤1 Month)",
      sublabel: `${daysRemaining}d left — 1 month cutoff`,
      color: "#DC2626",
      bgClass: "bg-rose-50 text-rose-800 border-rose-300 font-semibold",
      dotClass: "bg-rose-600",
    };
  }
  if (daysRemaining <= 180) {
    const mo = Math.max(1, Math.round(daysRemaining / 30));
    return {
      tier: "near_expiry_6m" as const,
      label: "Near Expiry (≤6 Months)",
      sublabel: `${daysRemaining}d remaining (~${mo}mo)`,
      color: "#EAB308",
      bgClass: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
      dotClass: "bg-amber-500",
    };
  }
  if (daysRemaining < 365) {
    const mo = Math.round(daysRemaining / 30);
    return {
      tier: "safe_shelf" as const,
      label: "Safe Shelf (6–12 Months)",
      sublabel: `${daysRemaining}d remaining (~${mo}mo)`,
      color: "#2DD4BF",
      bgClass: "bg-teal-50 text-teal-800 border-teal-300 font-medium",
      dotClass: "bg-teal-500",
    };
  }
  const mo = Math.round(daysRemaining / 30);
  return {
    tier: "valid_year" as const,
    label: "Valid In Stock (≥1 Year)",
    sublabel: `${daysRemaining}d remaining (~${mo}mo)`,
    color: "#00594C",
    bgClass: "bg-[#EAF5F2] text-[#00594C] border-[#00594C]/30 font-semibold",
    dotClass: "bg-[#00594C]",
  };
}

/**
 * Format date cleanly for medical inventory display.
 */
export function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return "Not Recorded";
  const targetDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(targetDate)) return "Invalid Date";
  return format(targetDate, "dd MMM yyyy");
}

/**
 * Parse pharmaceutical package date strings deterministically.
 *
 * Applicable Indian & International Drug Labelling Rule:
 * When an expiry date is stated only as Month and Year (e.g., "EXP. 08/2026", "08/26", "AUG 2026"),
 * the drug is deemed to expire on the LAST DAY of the stated month (e.g. 31 August 2026 at 23:59:59).
 *
 * Supported formats:
 * - MM/YYYY or MM-YYYY (e.g. "08/2026", "08-2026") -> Last day of month
 * - MM/YY or MM-YY (e.g. "08/26") -> Last day of month in 20YY
 * - MMM YYYY (e.g. "AUG 2026", "NOV 2025") -> Last day of month
 * - DD/MM/YYYY or DD-MM-YYYY (e.g. "15/08/2026") -> Exact day
 * - YYYY-MM-DD (ISO) -> Exact day
 */
export function parseMedicineExpiryDate(
  rawText: string | null | undefined
): { isoDate: string | null; precision: "day_month_year" | "month_year" | "unknown" } {
  if (!rawText) return { isoDate: null, precision: "unknown" };
  const cleaned = rawText.trim().toUpperCase().replace(/^(EXP|EXP\.|EXPIRY|EXPIRES|USE BEFORE|USE BY)[:\s]*/i, "");

  // 1. Exact DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    if (isValid(date)) {
      return { isoDate: date.toISOString(), precision: "day_month_year" };
    }
  }

  // 2. Exact YYYY-MM-DD (ISO)
  const iso = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    if (isValid(date)) {
      return { isoDate: date.toISOString(), precision: "day_month_year" };
    }
  }

  // 3. MM/YYYY or MM-YYYY (Standard Indian / International Drug Pack format)
  // Deemed to expire on the LAST DAY of the stated month.
  const mmyyyy = cleaned.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (mmyyyy) {
    const [, month, year] = mmyyyy;
    const monthNum = Number(month);
    const yearNum = Number(year);
    if (monthNum >= 1 && monthNum <= 12) {
      // Create first day of month, then get last day
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const lastDay = lastDayOfMonth(firstDay);
      lastDay.setHours(23, 59, 59, 999);
      return { isoDate: lastDay.toISOString(), precision: "month_year" };
    }
  }

  // 4. MM/YY or MM-YY (e.g. "08/26" for August 2026)
  const mmyy = cleaned.match(/^(\d{1,2})[-/.](\d{2})$/);
  if (mmyy) {
    const [, month, yy] = mmyy;
    const monthNum = Number(month);
    const yearNum = 2000 + Number(yy);
    if (monthNum >= 1 && monthNum <= 12) {
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const lastDay = lastDayOfMonth(firstDay);
      lastDay.setHours(23, 59, 59, 999);
      return { isoDate: lastDay.toISOString(), precision: "month_year" };
    }
  }

  // 5. MMM YYYY (e.g. "AUG 2026", "OCTOBER 2027")
  const monthNames: Record<string, number> = {
    JAN: 1, JANU: 1, JANUARY: 1,
    FEB: 2, FEBR: 2, FEBRUARY: 2,
    MAR: 3, MARC: 3, MARCH: 3,
    APR: 4, APRI: 4, APRIL: 4,
    MAY: 5,
    JUN: 6, JUNE: 6,
    JUL: 7, JULY: 7,
    AUG: 8, AUGU: 8, AUGUST: 8,
    SEP: 9, SEPT: 9, SEPTEMBER: 9,
    OCT: 10, OCTO: 10, OCTOBER: 10,
    NOV: 11, NOVE: 11, NOVEMBER: 11,
    DEC: 12, DECE: 12, DECEMBER: 12,
  };

  const mmmYyyy = cleaned.match(/^([A-Z]{3,9})[\s,/-]+(\d{2,4})$/);
  if (mmmYyyy) {
    const [, mStr, yStr] = mmmYyyy;
    const monthNum = monthNames[mStr.slice(0, 3)];
    let yearNum = Number(yStr);
    if (yearNum < 100) yearNum += 2000;
    if (monthNum && yearNum >= 2000 && yearNum <= 2100) {
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const lastDay = lastDayOfMonth(firstDay);
      lastDay.setHours(23, 59, 59, 999);
      return { isoDate: lastDay.toISOString(), precision: "month_year" };
    }
  }

  // Fallback check
  const parsed = new Date(cleaned);
  if (isValid(parsed) && !isNaN(parsed.getTime())) {
    return { isoDate: parsed.toISOString(), precision: "day_month_year" };
  }

  return { isoDate: null, precision: "unknown" };
}
