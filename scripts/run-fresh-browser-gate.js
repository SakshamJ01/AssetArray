/**
 * AssetArray — Post-Remediation Fresh-Browser Production Gate
 *
 * Runs the deployed application in a BRAND-NEW, fully isolated browser context
 * (no cookies, no localStorage, no session reuse) and verifies:
 *
 *   1. New session        -> Clients page is EMPTY
 *   2. Create ONE client  -> Clients = 1
 *   3. Reload             -> Clients = 1 (persisted)
 *   4. Logout -> Login    -> Clients = 1
 *   5. None of the known  test/synthetic names ever appear
 *
 * Requires env: E2E_TEST_USERNAME, E2E_TEST_PASSWORD (backend advisor creds).
 * The PIN is freshly generated per run; PIN 1234 test data is never used.
 *
 * Teardown always clears cookies + storage and closes the ephemeral context.
 */

const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const TARGET_URL = process.env.E2E_BASE_URL || "https://asset-array.web.app";
const CHROME_PATH = process.env.CHROME_PATH || null;

const FORBIDDEN_NAMES = [
  "Saksham jain",
  "Daksh",
  "E2E_TEST Priya Sharma",
  "Pooja Sharma",
  "Unified Discretionary Wealth",
  "Apex Custodial Statement",
];

const EVIDENCE_DIR = path.join(__dirname, "..", "docs", "uat-evidence", "screenshots");

async function ensureUnlocked(page, pin) {
  const pinInput = page.locator('input[type="password"]').first();
  const isPinVisible = await pinInput.isVisible({ timeout: 2500 }).catch(() => false);
  if (isPinVisible) {
    await pinInput.fill(pin);
    const saveBtn = page.getByText("Save PIN & Enter").first();
    const unlockBtn = page.getByText("Unlock with PIN").first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
    } else if (await unlockBtn.isVisible().catch(() => false)) {
      await unlockBtn.click();
    }
    await page.waitForTimeout(1500);
  }

  const loginScreen = page.getByText("Sign in to your advisor workspace").first();
  const isAuthVisible = await loginScreen.isVisible({ timeout: 2500 }).catch(() => false);
  if (isAuthVisible) {
    const user = process.env.E2E_TEST_USERNAME;
    const pass = process.env.E2E_TEST_PASSWORD;
    if (!user || !pass) {
      throw new Error("E2E_TEST_USERNAME/E2E_TEST_PASSWORD required for advisor login");
    }
    await page.getByPlaceholder("Username (e.g. admin)").fill(user);
    await page.getByPlaceholder("Password").fill(pass);
    await page.getByText("Sign In", { exact: true }).first().click();
    // The app shows "Verifying secure session..." while it validates the token;
    // wait for that to clear, then allow the dashboard to settle.
    await page.waitForFunction(
      () => !document.body.innerText.includes("Verifying secure session"),
      { timeout: 30000 }
    ).catch(() => undefined);
    await page.waitForFunction(
      () => document.body.innerText.includes("Dashboard") ||
             document.body.innerText.includes("Clients") ||
             document.body.innerText.includes("DESK ACTIONS"),
      { timeout: 30000 }
    ).catch(() => undefined);
    await page.waitForTimeout(2500);
  }
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name) });
}

async function gotoClients(page) {
  const tab = page.getByText("Clients").first();
  if (await tab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(1200);
  }
}

/**
 * Read the client roster count from the Clients screen's own counter text
 * ("N visible clients in this view") — the app's source of truth — falling back
 * to counting rendered client row shells.
 */
async function countClientRows(page) {
  return page.evaluate(() => {
    const text = document.body.innerText || "";
    const match = text.match(/(\d+)\s+visible clients?\s+in this view/i);
    if (match) return Number(match[1]);
    return document.querySelectorAll("[class*='clientRowShell']").length;
  });
}

/** Full visible text of the clients panel, for forbidden-name scanning. */
async function clientsPanelText(page) {
  return page.evaluate(() => document.body.innerText || "");
}

async function main() {
  console.log("================================================================");
  console.log("AssetArray — FRESH-BROWSER PRODUCTION GATE");
  console.log("================================================================");
  console.log("Target:", TARGET_URL);
  console.log("Mode  : fully isolated ephemeral browser context");
  console.log("");

  // Hard watchdog: the gate must never hang the CI runner.
  const watchdog = setTimeout(() => {
    console.error("[FATAL] Gate exceeded global watchdog budget (240s). Aborting.");
    process.exit(2);
  }, 240000);
  watchdog.unref?.();
  const stopWatchdog = () => clearTimeout(watchdog);

  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const results = [];
  const record = (step, status, detail) => {
    results.push({ step, status, detail });
    console.log(`[${status}] ${step} — ${detail}`);
  };

  // Fresh PIN per run. Never PIN 1234.
  const freshPin = String(100000 + Math.floor(Math.random() * 899999));

  const browser = await chromium.launch({
    ...(CHROME_PATH ? { executablePath: CHROME_PATH } : {}),
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const capturedBrowserVersion =
    typeof browser.version === "function"
      ? await Promise.resolve(browser.version()).catch(() => "unknown")
      : "unknown";

  // storageState: undefined => zero cookies, zero localStorage, zero sessions.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: undefined,
    acceptDownloads: false,
  });
  const page = await context.newPage();

  try {
    // ---- STEP 1: fresh session => clients EMPTY ----
    await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 45000 });
    await ensureUnlocked(page, freshPin);
    await gotoClients(page);
    await page.waitForTimeout(1500);
    await screenshot(page, "gate-01-fresh-clients.png");

    const emptyText = await clientsPanelText(page);
    const showsEmptyState = emptyText.includes("No clients yet");
    const initialCount = await countClientRows(page);
    record(
      "1. Fresh session clients EMPTY",
      showsEmptyState && initialCount === 0 ? "PASS" : "FAIL",
      `emptyState=${showsEmptyState}, rows=${initialCount}`
    );

    // ---- STEP 2: create exactly ONE legitimate client ----
    const addBtn = page.getByText("New Client Dossier").or(page.getByText("Add Client")).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(800);
      const nameInput = page.getByPlaceholder("Client name").first();
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill("Gate Verification Client");
        const phoneInput = page.getByPlaceholder("Phone number").first();
        if (await phoneInput.isVisible().catch(() => false)) {
          await phoneInput.fill("+91 98200 99999");
        }
        const saveBtn = page.getByText("Save Client").first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(1800);
        }
      }
    }
    await gotoClients(page);
    await page.waitForTimeout(1200);
    await screenshot(page, "gate-02-one-client.png");

    const afterCreateCount = await countClientRows(page);
    record(
      "2. After creating one client",
      afterCreateCount === 1 ? "PASS" : "FAIL",
      `rows=${afterCreateCount} (expected 1)`
    );

    // ---- STEP 3: reload => still 1 (persisted) ----
    await page.reload({ waitUntil: "networkidle", timeout: 45000 });
    await ensureUnlocked(page, freshPin);
    await gotoClients(page);
    await page.waitForTimeout(1500);
    await screenshot(page, "gate-03-after-reload.png");

    const afterReloadCount = await countClientRows(page);
    record(
      "3. After reload persistence",
      afterReloadCount === 1 ? "PASS" : "FAIL",
      `rows=${afterReloadCount} (expected 1)`
    );

    // ---- STEP 4: logout -> login => still 1 ----
    // Use the app's genuine Sign Out (Sync Config modal), which revokes the
    // backend session while PRESERVING the local encrypted vault (PIN +
    // clients). Clearing localStorage would also destroy the vault, which is
    // not what a real logout does.
    const settingsTab = page.getByText("Settings").first();
    if (await settingsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsTab.click();
      await page.waitForTimeout(1200);
    }
    const syncConfigBtn = page.getByText("Cloud Sync").or(page.getByText("Backend")).or(page.getByText("Sync")).first();
    if (await syncConfigBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await syncConfigBtn.click();
      await page.waitForTimeout(1200);
      const signOutBtn = page.getByText("Sign Out").first();
      if (await signOutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await signOutBtn.click();
        await page.waitForTimeout(2500);
      }
    }

    // Re-authenticate into the same local vault (PIN is retained, so unlock
    // rather than recreate), then sign back into the advisor workspace.
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2000);
    await ensureUnlocked(page, freshPin);
    await gotoClients(page);
    await page.waitForTimeout(1500);
    await screenshot(page, "gate-04-after-login.png");

    const afterLoginCount = await countClientRows(page);
    record(
      "4. After logout/login",
      afterLoginCount === 1 ? "PASS" : "FAIL",
      `rows=${afterLoginCount} (expected 1)`
    );

    // ---- STEP 5: forbidden names never appear ----
    const finalText = await clientsPanelText(page);
    const leaked = FORBIDDEN_NAMES.filter((n) => finalText.includes(n));
    record(
      "5. No test/synthetic names present",
      leaked.length === 0 ? "PASS" : "FAIL",
      leaked.length === 0 ? "none found" : `LEAKED: ${leaked.join(", ")}`
    );
  } catch (err) {
    record("FATAL", "FAIL", err.message);
  } finally {
    stopWatchdog();
    // Isolation teardown — always runs.
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch { /* best effort */ }
    try { await context.clearCookies(); } catch { /* best effort */ }
    try { await context.close(); } catch { /* best effort */ }
    try { await browser.close(); } catch { /* best effort */ }
  }

  const report = {
    executedAt: new Date().toISOString(),
    targetUrl: TARGET_URL,
    isolation: "fresh ephemeral context, storageState undefined",
    browserVersion: capturedBrowserVersion,
    steps: results,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.status === "PASS").length,
      failed: results.filter((r) => r.status === "FAIL").length,
    },
  };

  const reportPath = path.join(
    EVIDENCE_DIR,
    "..",
    "fresh-browser-gate-results.json"
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log("");
  console.log(`RESULT: ${report.summary.passed}/${report.summary.total} passed`);
  console.log("Report:", reportPath);
  console.log("================================================================");
  process.exitCode = report.summary.failed > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
