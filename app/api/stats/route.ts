import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { evaluateMedicineExpiry } from "@/lib/inventory/dates";
import { fetchWithCache } from "@/lib/cache/api-cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "all";

    const data = await fetchWithCache(`stats:${facilityId}`, 15, async () => {
      const [medicines, batches, facilities, movements, settings] = await Promise.all([
      prisma.medicine.findMany({ select: { id: true, category: true, dosageForm: true } }),
      prisma.medicineBatch.findMany({
        where: {
          status: { notIn: ["depleted"] },
          ...(facilityId !== "all"
            ? {
                balances: {
                  some: {
                    location: { facilityId },
                  },
                },
              }
            : {}),
        },
        include: {
          medicine: true,
          balances: {
            include: {
              location: {
                include: {
                  facility: true,
                },
              },
            },
          },
        },
        orderBy: { normalizedExpiryDate: "asc" },
      }),
      prisma.facility.findMany({
        include: {
          locations: {
            include: {
              balances: true,
            },
          },
        },
      }),
      prisma.stockMovement.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        include: {
          batch: {
            include: { medicine: true },
          },
          sourceLocation: {
            include: { facility: true },
          },
          destinationLocation: {
            include: { facility: true },
          },
        },
      }),
      prisma.appSettings.findUnique({ where: { id: "default" } }),
    ]);

    const nearDays = settings?.nearExpiryThresholdDays ?? 90;
    const criticalDays = settings?.criticalExpiryThresholdDays ?? 30;
    const urgentDays = settings?.urgentExpiryThresholdDays ?? 7;

    let totalStockUnits = 0;
    let expiredCount = 0;
    let urgentCount = 0;
    let criticalCount = 0;
    let nearExpiryCount = 0;
    let validCount = 0;
    let unverifiedCount = 0;

    const evaluatedBatches = batches.map((batch) => {
      const batchTotalQty = batch.balances.reduce((acc, b) => acc + b.quantity, 0);
      totalStockUnits += batchTotalQty;

      const evaluation = evaluateMedicineExpiry(
        batch.normalizedExpiryDate,
        batch.verifiedByStaff,
        nearDays,
        criticalDays,
        urgentDays
      );

      if (evaluation.status === "expired") expiredCount++;
      else if (evaluation.status === "urgent") urgentCount++;
      else if (evaluation.status === "critical") criticalCount++;
      else if (evaluation.status === "near_expiry") nearExpiryCount++;
      else if (evaluation.status === "valid") validCount++;
      else unverifiedCount++;

      return {
        ...batch,
        totalQuantity: batchTotalQty,
        evaluation,
      };
    });

    // Facility breakdown
    const inventoryByFacility = facilities.map((f) => {
      let units = 0;
      for (const loc of f.locations) {
        for (const bal of loc.balances) {
          units += bal.quantity;
        }
      }
      return {
        facility: f.name,
        type: f.type,
        units,
      };
    });

    // Category distribution
    const categoryMap: Record<string, number> = {};
    const dosageMap: Record<string, number> = {};

    for (const b of evaluatedBatches) {
      const cat = b.medicine.category || "General";
      const form = b.medicine.dosageForm || "Tablet";
      categoryMap[cat] = (categoryMap[cat] || 0) + b.totalQuantity;
      dosageMap[form] = (dosageMap[form] || 0) + b.totalQuantity;
    }

    const quantityByCategory = Object.entries(categoryMap)
      .map(([category, units]) => ({ category, units }))
      .sort((a, b) => b.units - a.units);

    const quantityByDosageForm = Object.entries(dosageMap)
      .map(([form, units]) => ({ form, units }))
      .sort((a, b) => b.units - a.units);

    // Risk distribution chart data
    const riskDistribution = [
      { name: "Valid / Safe Shelf", count: validCount, color: "#0d9488" },
      { name: "Near Expiry (≤90d)", count: nearExpiryCount, color: "#f59e0b" },
      { name: "Critical (≤30d)", count: criticalCount, color: "#ea580c" },
      { name: "Urgent (≤7d)", count: urgentCount, color: "#dc2626" },
      { name: "Expired (Blocked)", count: expiredCount, color: "#991b1b" },
      { name: "Unverified / Missing", count: unverifiedCount, color: "#64748b" },
    ].filter((item) => item.count > 0 || batches.length === 0);

    // Expiry timeline & Consecutive Monthly Breakdown
    const monthBuckets: Record<
      string,
      {
        dateKey: string;
        date: Date;
        month: string;
        fullMonth: string;
        units: number;
        batchCount: number;
        medicines: Set<string>;
      }
    > = {};

    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;

    for (const b of evaluatedBatches) {
      if (b.normalizedExpiryDate) {
        const d = new Date(b.normalizedExpiryDate);
        const y = d.getFullYear();
        const m = d.getMonth();
        const dateKey = `${y}-${String(m + 1).padStart(2, "0")}`;
        const monthLabel = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
        const fullMonthLabel = d.toLocaleString("en-US", { month: "long", year: "numeric" });

        if (!earliestDate || d < earliestDate) earliestDate = new Date(y, m, 1);
        if (!latestDate || d > latestDate) latestDate = new Date(y, m, 1);

        if (!monthBuckets[dateKey]) {
          monthBuckets[dateKey] = {
            dateKey,
            date: new Date(y, m, 1),
            month: monthLabel,
            fullMonth: fullMonthLabel,
            units: 0,
            batchCount: 0,
            medicines: new Set(),
          };
        }

        monthBuckets[dateKey].units += b.totalQuantity;
        monthBuckets[dateKey].batchCount += 1;
        if (b.medicine?.name) {
          monthBuckets[dateKey].medicines.add(b.medicine.name);
        }
      }
    }

    // Active milestones sorted chronologically
    const expiryTimeline = Object.values(monthBuckets)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map((item) => ({
        month: item.month,
        fullMonth: item.fullMonth,
        dateKey: item.dateKey,
        units: item.units,
        batchCount: item.batchCount,
        medicines: Array.from(item.medicines),
        hasExpiry: item.units > 0,
      }));

    // Consecutive month-by-month timeline (current month through latest expiry horizon)
    const monthlyTimeline: Array<{
      month: string;
      fullMonth: string;
      dateKey: string;
      units: number;
      batchCount: number;
      medicines: string[];
      hasExpiry: boolean;
    }> = [];

    const now = new Date();
    const startMonth =
      earliestDate && earliestDate < now
        ? earliestDate
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = latestDate || new Date(now.getFullYear(), now.getMonth() + 11, 1);

    const cursor = new Date(startMonth);
    while (cursor <= endMonth) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const bucket = monthBuckets[key];

      monthlyTimeline.push({
        month: cursor.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        fullMonth: cursor.toLocaleString("en-US", { month: "long", year: "numeric" }),
        dateKey: key,
        units: bucket ? bucket.units : 0,
        batchCount: bucket ? bucket.batchCount : 0,
        medicines: bucket ? Array.from(bucket.medicines) : [],
        hasExpiry: Boolean(bucket && bucket.units > 0),
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Critical attention queue (top items needing immediate clinical audit)
    const criticalAttentionList = evaluatedBatches
      .filter(
        (b) =>
          b.evaluation.status === "expired" ||
          b.evaluation.status === "urgent" ||
          b.evaluation.status === "critical" ||
          b.evaluation.status === "unverified"
      )
      .slice(0, 8);

      return {
        registeredMedicines: medicines.length,
        totalStockUnits,
        activeBatches: batches.length,
        expiredBatches: expiredCount,
        urgentBatches: urgentCount,
        criticalBatches: criticalCount,
        nearExpiryBatches: nearExpiryCount,
        validBatches: validCount,
        unverifiedCount,
        trackingFacilities: facilities.length,
        inventoryByFacility,
        quantityByCategory,
        quantityByDosageForm,
        riskDistribution,
        expiryTimeline,
        monthlyTimeline,
        criticalAttentionList,
        recentStockMovements: movements,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=45",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
