import { performance } from "perf_hooks";
import { prisma } from "../lib/db/prisma";
import { fetchWithCache, invalidateCache } from "../lib/cache/api-cache";

interface BenchmarkResult {
  operation: string;
  coldMs: number;
  indexedDbAvgMs: number;
  cacheHitAvgMs: number;
  speedupFactor: string;
}

function calcStats(runs: number[]) {
  const sorted = [...runs].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / sorted.length) * 100) / 100;
  const min = Math.round(sorted[0] * 100) / 100;
  const max = Math.round(sorted[sorted.length - 1] * 100) / 100;
  const p95Idx = Math.floor(sorted.length * 0.95);
  const p95 = Math.round(sorted[p95Idx] * 100) / 100;
  return { avg, min, max, p95 };
}

async function runAudit() {
  console.log("==========================================================");
  console.log("   AyuTrace: Cache Memory & Indexing Latency Audit        ");
  console.log("==========================================================\n");

  const ITERATIONS = 3;
  const results: BenchmarkResult[] = [];
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Warm up connection
  await prisma.$queryRaw`SELECT 1`;
  await delay(100);

  // ----------------------------------------------------
  // Test 1: Facilities List Query (/api/facilities)
  // ----------------------------------------------------
  console.log("1. Benchmarking Facilities Data (/api/facilities)...");
  invalidateCache("facilities:list");

  // Cold / Uncached run
  const t0ColdFac = performance.now();
  const coldFacData = await prisma.facility.findMany({
    include: { locations: { include: { balances: true } } },
    orderBy: { name: "asc" },
  });
  const coldFacMs = Math.round((performance.now() - t0ColdFac) * 10) / 10;

  // 3 Runs of Indexed Database (Uncached)
  const facDbRuns: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    await delay(60);
    const t0 = performance.now();
    await prisma.facility.findMany({
      include: { locations: { include: { balances: true } } },
      orderBy: { name: "asc" },
    });
    facDbRuns.push(performance.now() - t0);
  }
  const facDbStats = calcStats(facDbRuns);

  // 3 Runs of In-Memory Cache (Warm)
  await fetchWithCache("benchmark:facilities", 60, async () => coldFacData);
  const facCacheRuns: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await fetchWithCache("benchmark:facilities", 60, async () => coldFacData);
    facCacheRuns.push(performance.now() - t0);
  }
  const facCacheStats = calcStats(facCacheRuns);

  results.push({
    operation: "Facilities (/api/facilities)",
    coldMs: coldFacMs,
    indexedDbAvgMs: facDbStats.avg,
    cacheHitAvgMs: facCacheStats.avg,
    speedupFactor: `${Math.round(facDbStats.avg / Math.max(facCacheStats.avg, 0.01))}x faster`,
  });

  // ----------------------------------------------------
  // Test 2: Complex Inventory Query (/api/inventory)
  // ----------------------------------------------------
  console.log("2. Benchmarking Medicine Inventory Query (/api/inventory)...");
  const t0ColdInv = performance.now();
  const coldInvData = await prisma.medicineBatch.findMany({
    where: { status: { notIn: ["depleted"] } },
    include: {
      medicine: true,
      balances: { include: { location: { include: { facility: true } } } },
    },
    orderBy: { normalizedExpiryDate: "asc" },
  });
  const coldInvMs = Math.round((performance.now() - t0ColdInv) * 10) / 10;

  // 3 Runs of Indexed Database (Uncached)
  const invDbRuns: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    await delay(60);
    const t0 = performance.now();
    await prisma.medicineBatch.findMany({
      where: { status: { notIn: ["depleted"] } },
      include: {
        medicine: true,
        balances: { include: { location: { include: { facility: true } } } },
      },
      orderBy: { normalizedExpiryDate: "asc" },
    });
    invDbRuns.push(performance.now() - t0);
  }
  const invDbStats = calcStats(invDbRuns);

  // 10 Runs of In-Memory Cache (Warm)
  await fetchWithCache("benchmark:inventory", 60, async () => coldInvData);
  const invCacheRuns: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await fetchWithCache("benchmark:inventory", 60, async () => coldInvData);
    invCacheRuns.push(performance.now() - t0);
  }
  const invCacheStats = calcStats(invCacheRuns);

  results.push({
    operation: "Inventory Query (/api/inventory)",
    coldMs: coldInvMs,
    indexedDbAvgMs: invDbStats.avg,
    cacheHitAvgMs: invCacheStats.avg,
    speedupFactor: `${Math.round(invDbStats.avg / Math.max(invCacheStats.avg, 0.01))}x faster`,
  });

  // ----------------------------------------------------
  // Test 3: Dashboard Multi-Query KPI Aggregate (/api/stats)
  // ----------------------------------------------------
  console.log("3. Benchmarking Dashboard KPI Aggregation (/api/stats)...");
  const statsFetcher = async () => {
    const totalMedicinesCount = await prisma.medicine.count();
    const batches = await prisma.medicineBatch.findMany({
      where: { status: { notIn: ["depleted"] } },
      select: {
        id: true,
        batchNumber: true,
        expiryDateText: true,
        normalizedExpiryDate: true,
        datePrecision: true,
        status: true,
        verifiedByStaff: true,
        medicine: {
          select: {
            id: true,
            name: true,
            genericName: true,
            strength: true,
            dosageForm: true,
            category: true,
          },
        },
        balances: {
          select: {
            quantity: true,
            location: {
              select: {
                name: true,
                facility: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { normalizedExpiryDate: "asc" },
    });
    const facilities = await prisma.facility.findMany({
      select: {
        name: true,
        type: true,
        locations: {
          select: {
            balances: { select: { quantity: true } },
          },
        },
      },
    });
    const movements = await prisma.stockMovement.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        quantity: true,
        movementType: true,
        reason: true,
        notes: true,
        performedBy: true,
        createdAt: true,
        batch: {
          select: {
            batchNumber: true,
            medicine: { select: { name: true, strength: true } },
          },
        },
        sourceLocation: {
          select: { name: true, facility: { select: { name: true } } },
        },
        destinationLocation: {
          select: { name: true, facility: { select: { name: true } } },
        },
      },
    });
    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: {
        nearExpiryThresholdDays: true,
        criticalExpiryThresholdDays: true,
        urgentExpiryThresholdDays: true,
      },
    });
    return [totalMedicinesCount, batches, facilities, movements, settings];
  };

  const t0ColdStats = performance.now();
  const coldStatsData = await statsFetcher();
  const coldStatsMs = Math.round((performance.now() - t0ColdStats) * 10) / 10;

  // 3 Runs of Indexed Database (Uncached)
  const statsDbRuns: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    await delay(60);
    const t0 = performance.now();
    await statsFetcher();
    statsDbRuns.push(performance.now() - t0);
  }
  const statsDbStats = calcStats(statsDbRuns);

  // 3 Runs of In-Memory Cache (Warm)
  await fetchWithCache("benchmark:stats", 60, async () => coldStatsData);
  const statsCacheRuns: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await fetchWithCache("benchmark:stats", 60, async () => coldStatsData);
    statsCacheRuns.push(performance.now() - t0);
  }
  const statsCacheStats = calcStats(statsCacheRuns);

  results.push({
    operation: "Dashboard Stats (/api/stats)",
    coldMs: coldStatsMs,
    indexedDbAvgMs: statsDbStats.avg,
    cacheHitAvgMs: statsCacheStats.avg,
    speedupFactor: `${Math.round(statsDbStats.avg / Math.max(statsCacheStats.avg, 0.01))}x faster`,
  });

  // ----------------------------------------------------
  // Test 4: Single Settings Record Lookup (/api/settings)
  // ----------------------------------------------------
  console.log("4. Benchmarking Settings Record Lookup (/api/settings)...");
  const t0ColdSet = performance.now();
  const coldSetData = await prisma.appSettings.findUnique({ where: { id: "default" } });
  const coldSetMs = Math.round((performance.now() - t0ColdSet) * 10) / 10;

  const setDbRuns: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    await delay(60);
    const t0 = performance.now();
    await prisma.appSettings.findUnique({ where: { id: "default" } });
    setDbRuns.push(performance.now() - t0);
  }
  const setDbStats = calcStats(setDbRuns);

  await fetchWithCache("benchmark:settings", 60, async () => coldSetData);
  const setCacheRuns: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await fetchWithCache("benchmark:settings", 60, async () => coldSetData);
    setCacheRuns.push(performance.now() - t0);
  }
  const setCacheStats = calcStats(setCacheRuns);

  results.push({
    operation: "Settings Record (/api/settings)",
    coldMs: coldSetMs,
    indexedDbAvgMs: setDbStats.avg,
    cacheHitAvgMs: setCacheStats.avg,
    speedupFactor: `${Math.round(setDbStats.avg / Math.max(setCacheStats.avg, 0.01))}x faster`,
  });

  // ----------------------------------------------------
  // Test 5: Authentication & Session Verification Flow
  // ----------------------------------------------------
  console.log("5. Benchmarking Auth Login & Session Check...");
  const sampleUser = await prisma.user.findFirst();
  if (sampleUser) {
    const authQuery = async () =>
      prisma.user.findUnique({
        where: { email: sampleUser.email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
          facilityId: true,
        },
      });

    const t0ColdAuth = performance.now();
    await authQuery();
    const coldAuthMs = Math.round((performance.now() - t0ColdAuth) * 10) / 10;

    const authDbRuns: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      await delay(60);
      const t0 = performance.now();
      await authQuery();
      authDbRuns.push(performance.now() - t0);
    }
    const authDbStats = calcStats(authDbRuns);

    // Session RAM Cache hit test
    const ramSessionStore = new Map();
    ramSessionStore.set("test-token", { user: sampleUser, expiresAt: Date.now() + 86400000 });
    const ramCacheRuns: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      ramSessionStore.get("test-token");
      ramCacheRuns.push(performance.now() - t0);
    }
    const ramCacheStats = calcStats(ramCacheRuns);

    results.push({
      operation: "User Login & Session (/api/auth)",
      coldMs: coldAuthMs,
      indexedDbAvgMs: authDbStats.avg,
      cacheHitAvgMs: ramCacheStats.avg,
      speedupFactor: `${Math.round(authDbStats.avg / Math.max(ramCacheStats.avg, 0.01))}x faster`,
    });
  }

  console.log("\n==========================================================");
  console.log("       EMPIRICAL LATENCY BENCHMARK: CACHE & INDEXES        ");
  console.log("==========================================================");
  console.table(
    results.map((r) => ({
      "Endpoint / Flow": r.operation,
      "Cold DB Time": `${r.coldMs} ms`,
      "Indexed DB (Avg)": `${r.indexedDbAvgMs} ms`,
      "Cache Memory (Avg)": `${r.cacheHitAvgMs} ms`,
      "Speedup Factor": r.speedupFactor,
    }))
  );

  await prisma.$disconnect();
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
