/**
 * AssetArray — Browser Storage Migration Verification (controlled browser)
 *
 * Injects a LEGACY-style localStorage payload (bare pre-V4 array containing a
 * mix of legitimate + synthetic + known-test records), reloads the deployed
 * application, and verifies the versioned migration:
 *
 *   1. legitimate client records migrate forward and survive
 *   2. synthetic aggregate records are quarantined (not shown, not erased)
 *   3. known legacy test records are quarantined (not shown, not erased)
 *   4. no legitimate client is lost
 *   5. the store is rewritten in the current versioned envelope
 *
 * Runs in a fresh ephemeral context. Teardown clears all storage.
 */

const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const TARGET_URL = process.env.E2E_BASE_URL || "https://asset-array.web.app";
const CHROME_PATH = process.env.CHROME_PATH || null;

// A legacy pre-V4 bare array (schema v1 shape) with a representative mix.
function legacyPayload() {
  return [
    {
      id: "cli_legit_a",
      name: "Ananya Legitimate Client",
      phone: "+919820000111",
      email: "ananya.legit@example.com",
      category: "HNI",
      riskProfile: "Balanced",
      preferredChannel: "Email",
      watchlist: [],
      notes: "Pre-V4 record that must survive migration",
      city: "Bengaluru",
      allocation: "Balanced",
      reminderDate: "2026-09-01T00:00:00.000Z",
      priority: "High",
      lastContact: "2026-08-20T00:00:00.000Z",
      updateHistory: [],
      portfolio: [],
    },
    {
      id: "cli_legit_b",
      name: "Vikram Legitimate Client",
      phone: "+919820000222",
      email: "vikram.legit@example.com",
      category: "Retail",
      riskProfile: "Conservative",
      preferredChannel: "WhatsApp",
      watchlist: [],
      notes: "Another pre-V4 record",
      city: "Pune",
      allocation: "Conservative",
      reminderDate: "2026-09-10T00:00:00.000Z",
      priority: "Medium",
      lastContact: "2026-08-30T00:00:00.000Z",
      updateHistory: [],
      portfolio: [],
    },
    // Synthetic aggregate (must be quarantined, never shown as a client).
    {
      id: "unified-discretionary",
      name: "Unified Discretionary Wealth",
      phone: "+919876543210",
      email: "fiduciary@assetarray.com",
      category: "Family Office",
      riskProfile: "Balanced Wealth",
      preferredChannel: "Email",
      watchlist: [],
      notes: "Unified cross-client portfolio mandate",
      city: "Mumbai",
      allocation: "Balanced Wealth",
      reminderDate: "2026-09-01T00:00:00.000Z",
      priority: "High",
      lastContact: "2026-08-20T00:00:00.000Z",
      updateHistory: [],
      portfolio: [],
    },
    // Known legacy test records (must be quarantined, never shown).
    {
      id: "1777753624999",
      name: "Saksham jain",
      phone: "9982594985",
      email: "jainsaksham8b@gmail.com",
      category: "Retail",
      riskProfile: "",
      preferredChannel: "WhatsApp",
      watchlist: [],
      notes: "",
      city: "",
      allocation: "",
      reminderDate: "",
      priority: "Medium",
      lastContact: "",
      updateHistory: [],
      portfolio: [],
    },
    {
      id: "1777796687993",
      name: "Daksh",
      phone: "9982594985",
      email: "jainsaksham8b@gmail.com",
      category: "Retail",
      riskProfile: "",
      preferredChannel: "WhatsApp",
      watchlist: [],
      notes: "",
      city: "",
      allocation: "",
      reminderDate: "",
      priority: "Medium",
      lastContact: "",
      updateHistory: [],
      portfolio: [],
    },
    {
      id: "client_e2e_0001",
      name: "E2E_TEST Priya Sharma",
      phone: "+91 98200 12345",
      email: "priya.e2e@example.com",
      category: "Retail",
      riskProfile: "",
      preferredChannel: "WhatsApp",
      watchlist: [],
      notes: "",
      city: "",
      allocation: "",
      reminderDate: "",
      priority: "Medium",
      lastContact: "",
      updateHistory: [],
      portfolio: [],
    },
  ];
}

async function readStorage(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("asset_array_clients");
    const quarantine = localStorage.getItem("asset_array_clients_quarantine");
    return { raw, quarantine };
  });
}

async function main() {
  console.log("================================================================");
  console.log("AssetArray — BROWSER STORAGE MIGRATION VERIFICATION");
  console.log("================================================================");
  console.log("Target:", TARGET_URL);
  console.log("");

  const results = [];
  const record = (step, status, detail) => {
    results.push({ step, status, detail });
    console.log(`[${status}] ${step} — ${detail}`);
  };

  const browser = await chromium.launch({
    ...(CHROME_PATH ? { executablePath: CHROME_PATH } : {}),
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: undefined,
    acceptDownloads: false,
  });
  const page = await context.newPage();

  const watchdog = setTimeout(() => {
    console.error("[FATAL] migration gate exceeded watchdog (180s)");
    process.exit(2);
  }, 180000);
  watchdog.unref?.();

  try {
    // ---- Inject legacy state before the app bootstraps ----
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1500);

    const injected = legacyPayload();
    await page.evaluate((payload) => {
      // Legacy schema v1 shape: a bare JSON array, no envelope.
      localStorage.setItem("asset_array_clients", JSON.stringify(payload));
    }, injected);

    const preMigration = await readStorage(page);
    console.log("Injected legacy records:", injected.length,
                "(2 legitimate + 1 synthetic + 3 test)");

    // ---- Reload so the app's boot migration runs against the legacy store ----
    await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(4000);

    const post = await readStorage(page);
    let parsed = null;
    try {
      parsed = JSON.parse(post.raw);
    } catch {
      parsed = null;
    }

    const isEnvelope =
      parsed && typeof parsed === "object" && !Array.isArray(parsed) &&
      typeof parsed.schemaVersion === "number" && Array.isArray(parsed.clients);

    record(
      "1. Store rewritten to versioned envelope",
      isEnvelope ? "PASS" : "FAIL",
      isEnvelope
        ? `schemaVersion=${parsed.schemaVersion}`
        : `raw shape=${Array.isArray(parsed) ? "legacy-array" : "unparsed"}`
    );

    const migratedIds = isEnvelope ? parsed.clients.map((c) => c.id) : [];
    record(
      "2. Legitimate clients migrated forward",
      migratedIds.includes("cli_legit_a") && migratedIds.includes("cli_legit_b") ? "PASS" : "FAIL",
      `present=${migratedIds.filter((id) => id.startsWith("cli_legit")).join(",") || "none"}`
    );

    const syntheticShown = migratedIds.includes("unified-discretionary");
    record(
      "3. Synthetic aggregate quarantined (not in roster)",
      !syntheticShown ? "PASS" : "FAIL",
      syntheticShown ? "LEAKED into roster" : "absent from roster"
    );

    const testShown = migratedIds.filter((id) =>
      ["1777753624999", "1777796687993", "client_e2e_0001"].includes(id)
    );
    record(
      "4. Legacy test records quarantined (not in roster)",
      testShown.length === 0 ? "PASS" : "FAIL",
      testShown.length === 0 ? "none present" : `LEAKED: ${testShown.join(",")}`
    );

    // Quarantine preserves (never erases) the removed records.
    let quarantinedIds = [];
    try {
      quarantinedIds = (JSON.parse(post.quarantine) || []).map((c) => c.id);
    } catch {
      quarantinedIds = [];
    }
    const expectedQuarantined = ["unified-discretionary", "1777753624999", "1777796687993", "client_e2e_0001"];
    const quarantinedOk = expectedQuarantined.every((id) => quarantinedIds.includes(id));
    record(
      "5. Quarantine preserved removed records (no data loss)",
      quarantinedOk ? "PASS" : "FAIL",
      quarantinedOk
        ? `${quarantinedIds.length} quarantined`
        : `missing: ${expectedQuarantined.filter((id) => !quarantinedIds.includes(id)).join(",")}`
    );

    // Total accounting: nobody silently destroyed.
    const totalAccounted = migratedIds.length + quarantinedIds.length;
    record(
      "6. No record silently lost",
      totalAccounted === injected.length ? "PASS" : "FAIL",
      `migrated=${migratedIds.length} quarantined=${quarantinedIds.length} injected=${injected.length}`
    );
  } catch (err) {
    record("FATAL", "FAIL", err.message);
  } finally {
    clearTimeout(watchdog);
    try {
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    } catch { /* best effort */ }
    try { await context.clearCookies(); } catch { /* best effort */ }
    try { await context.close(); } catch { /* best effort */ }
    try { await browser.close(); } catch { /* best effort */ }
  }

  const report = {
    executedAt: new Date().toISOString(),
    targetUrl: TARGET_URL,
    isolation: "fresh ephemeral context, storageState undefined",
    steps: results,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.status === "PASS").length,
      failed: results.filter((r) => r.status === "FAIL").length,
    },
  };
  const reportPath = path.join(__dirname, "..", "docs", "uat-evidence", "storage-migration-results.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log("");
  console.log(`RESULT: ${report.summary.passed}/${report.summary.total} passed`);
  console.log("Report:", reportPath);
  process.exitCode = report.summary.failed > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
