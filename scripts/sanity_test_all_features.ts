import fs from "fs";
import path from "path";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failedCount++;
  }
}

async function run() {
  console.log("===============================================================");
  console.log("       AYUTRACE FULL SYSTEM SANITY TEST (REAL HTTP)           ");
  console.log("===============================================================\n");

  const baseUrl = "http://localhost:3000";
  let cookieHeader = "";
  let targetFacilityId = "";
  let targetLocationId = "";
  let createdBatchId = "";
  let createdMedicineId = "";

  // 1. PUBLIC & AUTH ENDPOINTS
  console.log("▶ [1/8] Testing Authentication Workflows & Session Security");
  try {
    // 1.1 Invalid Login attempt
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "pharmacist@ayutrace.org", password: "InvalidPassword123!" }),
    });
    const badLoginJson = await badLoginRes.json();
    assert(badLoginRes.status === 401 && !badLoginJson.success, "Invalid login correctly returns 401 Unauthorized");

    // 1.2 Valid Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "pharmacist@ayutrace.org", password: "Password123!", rememberMe: true }),
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200 && loginJson.success, "Valid login returns 200 OK");
    assert(loginJson.user.email === "pharmacist@ayutrace.org", `Authenticated as: ${loginJson.user.name} (${loginJson.user.role})`);
    assert(!loginJson.user.passwordHash, "Security: passwordHash is not exposed in JSON");

    // Extract cookie
    const rawCookie = loginRes.headers.get("set-cookie") || "";
    assert(rawCookie.includes("ayutrace_session="), "Received authenticated ayutrace_session cookie");
    cookieHeader = rawCookie.split(";")[0];

    // 1.3 Verify Session via /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    const meJson = await meRes.json();
    assert(meRes.status === 200 && meJson.success && meJson.user.id.length > 0, "/api/auth/me successfully verifies session token");
  } catch (err: any) {
    console.error("  Auth workflow error:", err.message);
    failedCount++;
  }

  // 2. FACILITIES & STORAGE UNITS
  console.log("\n▶ [2/8] Testing Healthcare Facilities & Storage Units");
  try {
    const facRes = await fetch(`${baseUrl}/api/facilities`, {
      headers: { Cookie: cookieHeader },
    });
    const facJson = await facRes.json();
    assert(facRes.status === 200 && facJson.success, "/api/facilities returns 200 OK");
    assert(Array.isArray(facJson.data) && facJson.data.length > 0, `Loaded ${facJson.data.length} registered clinical facilities`);
    
    targetFacilityId = facJson.data[0].id;
    assert(Boolean(targetFacilityId), `Selected primary facility: "${facJson.data[0].name}"`);
    assert(Array.isArray(facJson.data[0].locations) && facJson.data[0].locations.length > 0, `Verified ${facJson.data[0].locations.length} storage units`);
    targetLocationId = facJson.data[0].locations[0].id;
  } catch (err: any) {
    console.error("  Facilities error:", err.message);
    failedCount++;
  }

  // 3. CLINICAL INVENTORY QUERY & INTAKE
  console.log("\n▶ [3/8] Testing Medicine Inventory Catalog & Stock Intake");
  try {
    // 3.1 List inventory
    const invRes = await fetch(`${baseUrl}/api/inventory`, {
      headers: { Cookie: cookieHeader },
    });
    const invJson = await invRes.json();
    assert(invRes.status === 200 && invJson.success, "/api/inventory query returns 200 OK");
    assert(Array.isArray(invJson.data), `Active catalog contains ${invJson.data.length} medicines`);

    // 3.2 Create new clinical intake
    const uniqueBatch = `LOT-TEST-${Date.now().toString().slice(-6)}`;
    const intakeRes = await fetch(`${baseUrl}/api/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        name: "Amoxicillin and Potassium Clavulanate IP",
        genericName: "Amoxicillin 500mg + Clavulanic Acid 125mg",
        brand: "Augmentin 625 Duo",
        manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
        strength: "625 mg",
        dosageForm: "Tablet",
        category: "Antibiotics",
        scheduleType: "Schedule H",
        batchNumber: uniqueBatch,
        manufacturingDateText: "01/2026",
        expiryDateText: "12/2027",
        facilityId: targetFacilityId,
        locationId: targetLocationId,
        quantity: 50,
        verifiedBy: "Staff Pharmacist SanityCheck",
        notes: "Intake verified via automated sanity run",
      }),
    });
    const intakeJson = await intakeRes.json();
    assert(intakeRes.status === 201 && intakeJson.success, `Created medicine batch ${uniqueBatch} via /api/inventory (201 Created)`);
    createdBatchId = intakeJson.data.id;
    createdMedicineId = intakeJson.data.medicineId;

    // 3.3 Adjust stock via /api/inventory/[id]/adjust (dispense 5 units)
    const adjustRes = await fetch(`${baseUrl}/api/inventory/${createdBatchId}/adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        locationId: targetLocationId,
        quantityChange: -5,
        reason: "dispense",
        notes: "Patient prescription order #RX-994",
        performedBy: "Staff Pharmacist SanityCheck",
      }),
    });
    const adjustJson = await adjustRes.json();
    assert(adjustRes.status === 200 && adjustJson.success, "Stock adjustment /api/inventory/[id]/adjust succeeded (200 OK)");
    assert(adjustJson.data.balance.quantity === 45, `Stock balance accurately decremented: 50 -> ${adjustJson.data.balance.quantity}`);
  } catch (err: any) {
    console.error("  Inventory error:", err.message);
    failedCount++;
  }

  // 4. STATS & ANALYTICS
  console.log("\n▶ [4/8] Testing Clinical Stats & Expiry Analytics");
  try {
    const statsRes = await fetch(`${baseUrl}/api/stats`, {
      headers: { Cookie: cookieHeader },
    });
    const statsJson = await statsRes.json();
    assert(statsRes.status === 200 && statsJson.success, "/api/stats returns 200 OK");
    assert(typeof statsJson.data.registeredMedicines === "number", `Total medicines tracked: ${statsJson.data.registeredMedicines}`);
    assert(typeof statsJson.data.activeBatches === "number", `Active batches monitored: ${statsJson.data.activeBatches}`);
    assert(typeof statsJson.data.totalStockUnits === "number", `Total clinical stock units: ${statsJson.data.totalStockUnits}`);
    assert(Array.isArray(statsJson.data.criticalAttentionList), `Critical attention queue computed (${statsJson.data.criticalAttentionList.length} items flagged)`);
  } catch (err: any) {
    console.error("  Stats error:", err.message);
    failedCount++;
  }

  // 5. STOCK TRANSFERS
  console.log("\n▶ [5/8] Testing Inter-Facility Stock Transfers");
  try {
    const transferRes = await fetch(`${baseUrl}/api/transfers`, {
      headers: { Cookie: cookieHeader },
    });
    const transferJson = await transferRes.json();
    assert(transferRes.status === 200 && transferJson.success, "/api/transfers returns 200 OK");
    assert(Array.isArray(transferJson.data), `Transfer ledger verified (${transferJson.data.length} historical transfers)`);
  } catch (err: any) {
    console.error("  Transfers error:", err.message);
    failedCount++;
  }

  // 6. CLINICAL SETTINGS & GEMINI CONFIGURATION
  console.log("\n▶ [6/8] Testing System Settings & AI Vision Configuration");
  try {
    const settingsRes = await fetch(`${baseUrl}/api/settings`, {
      headers: { Cookie: cookieHeader },
    });
    const settingsJson = await settingsRes.json();
    assert(settingsRes.status === 200 && settingsJson.success, "/api/settings returns 200 OK");
    assert(settingsJson.data.isGemmaConfigured === true, "Gemini Vision API key is loaded & verified");
    assert(
      settingsJson.data.configuredModel === "gemini-3.5-flash-lite" ||
      settingsJson.data.configuredModel === "gemini-3.1-flash-lite",
      `High-speed AI model active: "${settingsJson.data.configuredModel}" (sub-3s target)`
    );
  } catch (err: any) {
    console.error("  Settings error:", err.message);
    failedCount++;
  }

  // 7. AI PACKAGING SCANNER LATENCY & PARSING VIA HTTP
  console.log("\n▶ [7/8] Testing Live AI Packaging Vision Scanner (/api/scan-medicine)");
  try {
    const imgPath = path.resolve(process.cwd(), "public/logo.png");
    const b64 = fs.readFileSync(imgPath).toString("base64");

    const t0 = Date.now();
    const scanRes = await fetch(`${baseUrl}/api/scan-medicine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        imageBase64: b64,
        mimeType: "image/png",
        imageName: "logo.png",
      }),
    });
    const scanJson = await scanRes.json();
    const duration = ((Date.now() - t0) / 1000).toFixed(2);

    assert(scanRes.status === 200 && scanJson.success, "/api/scan-medicine returns 200 OK with success: true");
    assert(scanJson.isLive === true, `Live cloud vision confirmed (Model: ${scanJson.modelUsed})`);
    assert(Number(duration) < 5.0, `Scan latency is ultra-fast: ${duration}s (Goal: <5.0s, previously 30s)`);
    assert(typeof scanJson.data === "object", "Structured JSON pharmaceutical schema parsed successfully");
  } catch (err: any) {
    console.error("  Scan error:", err.message);
    failedCount++;
  }

  // 8. LOGOUT & SESSION TERMINATION
  console.log("\n▶ [8/8] Testing Logout & Session Invalidation");
  try {
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
    });
    assert(logoutRes.status === 200, "/api/auth/logout returned 200 OK");

    const postLogoutMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    const postLogoutJson = await postLogoutMe.json();
    assert(!postLogoutJson.user, "Post-logout: /api/auth/me confirms session is terminated (user: null)");
  } catch (err: any) {
    console.error("  Logout error:", err.message);
    failedCount++;
  }

  // CLEANUP SANITY TEST DATA
  console.log("\n▶ Cleaning up temporary sanity data from database...");
  try {
    const { prisma } = await import("../lib/db/prisma");
    if (createdBatchId) {
      await prisma.stockMovement.deleteMany({ where: { batchId: createdBatchId } });
      await prisma.stockBalance.deleteMany({ where: { batchId: createdBatchId } });
      await prisma.medicineBatch.delete({ where: { id: createdBatchId } });
    }
    if (createdMedicineId) {
      await prisma.medicine.delete({ where: { id: createdMedicineId } });
    }
    await prisma.$disconnect();
    console.log("  ✓ Database cleaned up cleanly with zero orphaned records.");
  } catch (e: any) {
    console.warn("  Cleanup warning:", e.message);
  }

  console.log("\n===============================================================");
  console.log(` SANITY TEST COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED (Total: ${passedCount + failedCount})`);
  console.log("===============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal runner crash:", err);
  process.exit(1);
});
