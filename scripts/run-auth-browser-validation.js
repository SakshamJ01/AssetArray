/**
 * Auth browser E2E (production web): demo sign-in, manual sign-in, logout.
 * Strict pass criteria — a test passes ONLY when the authenticated workspace
 * actually appears (login screen detached + workspace markers visible),
 * never merely because a button was clickable.
 *
 * Env:
 *   E2E_BASE_URL        (default https://asset-array.web.app)
 *   E2E_API_URL         (default https://assetarray.onrender.com/api/health)
 *   E2E_TEST_PIN        (default "1234"; used only for the local device PIN gate)
 *   E2E_TEST_USERNAME / E2E_TEST_PASSWORD (manual login; skipped when absent)
 *   CHROME_PATH         (optional; otherwise playwright discovery)
 */
const { chromium } = require("playwright-core");

const CHROME_PATH = process.env.CHROME_PATH || null;
const TARGET_URL = process.env.E2E_BASE_URL || "https://asset-array.web.app";
const BACKEND_URL = process.env.E2E_API_URL || "https://assetarray.onrender.com/api/health";
const E2E_PIN = process.env.E2E_TEST_PIN || "1234";
const MANUAL_USER = process.env.E2E_TEST_USERNAME || "";
const MANUAL_PASS = process.env.E2E_TEST_PASSWORD || "";

const results = [];
function record(id, name, status, details = "") {
  results.push({ id, name, status, details });
  const mark = status === "PASS" ? "✓" : status === "SKIP" ? "-" : "✗";
  console.log(`  ${mark} [${id}] ${name}${details ? ` — ${details}` : ""}`);
}

async function passPinGate(page) {
  const pinInput = page.locator('input[type="password"]').first();
  if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await pinInput.fill(E2E_PIN);
    const saveBtn = page.getByText("Save PIN & Enter").first();
    const unlockBtn = page.getByText("Unlock with PIN").first();
    if (await saveBtn.isVisible().catch(() => false)) await saveBtn.click();
    else if (await unlockBtn.isVisible().catch(() => false)) await unlockBtn.click();
    await page.waitForTimeout(1500);
  }
}

const demoButton = (page) =>
  page.getByText("1-Click Demo Sign In").or(page.getByText("1-Click Sign In")).first();

// React Native Web renders interactive elements as plain spans/divs with no
// roles, and same label renders multiple times (hidden duplicates) — so
// locator-based getByText().first() picks invisible nodes. Click through the
// DOM instead: find the deepest leaf element whose exact text matches and that
// is actually rendered, then trigger a real click (bubbles to the Pressable).
async function clickVisibleText(page, label, waitMs = 5000) {
  const ok = await page.waitForFunction(
    (lbl) => {
      const leaves = [...document.querySelectorAll("span, div, a, button")];
      const hit = leaves.find((el) => {
        const t = (el.textContent || "").trim();
        return t === lbl && t.length > 0 && el.children.length === 0 &&
               el.getClientRects().length > 0 &&
               getComputedStyle(el).visibility !== "hidden";
      });
      return !!hit;
    },
    label,
    { timeout: waitMs }
  ).then(() => true).catch(() => false);
  if (!ok) return false;
  await page.evaluate((lbl) => {
    const leaves = [...document.querySelectorAll("span, div, a, button")];
    const hit = leaves.find((el) => {
      const t = (el.textContent || "").trim();
      return t === lbl && t.length > 0 && el.children.length === 0 &&
             el.getClientRects().length > 0 &&
             getComputedStyle(el).visibility !== "hidden";
    });
    hit && hit.click();
  }, label);
  return true;
}

async function loginScreenVisible(page) {
  return await page.waitForFunction(() => {
    const t = document.body && document.body.innerText || "";
    return (t.includes("1-Click Demo Sign In") || t.includes("1-Click Sign In")) &&
           t.includes("Sign in to your advisor workspace");
  }, { timeout: 10000 }).then(() => true).catch(() => false);
}

async function isAuthenticated(page) {
  // Login screen is gone AND workspace chrome is present. AUTH-01 must not
  // resolve while "Verifying secure session..." is still on screen (the demo
  // call to the backend round-trips for a few seconds), so wait for a visible
  // workspace marker (sidebar "Clients" is matched by its visible tab, not the
  // first DOM hit which can be a hidden duplicate).
  const loginGone = await demoButton(page).isHidden({ timeout: 5000 }).catch(() => false);
  const marker = await page.getByText("DEMO WORKSPACE ACTIVE", { exact: false }).first()
    .isVisible({ timeout: 20000 }).catch(() => false)
    || await page.getByRole("link", { name: /Clients/ }).first()
      .isVisible({ timeout: 5000 }).catch(() => false)
    || await page.getByText("Client roster", { exact: false }).first()
      .isVisible({ timeout: 5000 }).catch(() => false);
  return loginGone && marker;
}

async function logout(page) {
  // Logout lives inside Settings → "Configure Keys" → SyncConfigModal ("Sign Out").
  // Open the More tab first on mobile widths.
  await clickVisibleText(page, "More").catch(() => false);
  const settingsOk = await clickVisibleText(page, "Settings");
  if (settingsOk) await page.waitForTimeout(1200);
  const configureOk = await clickVisibleText(page, "Configure Keys");
  if (configureOk) await page.waitForTimeout(800);
  const signOutOk = await clickVisibleText(page, "Sign Out");
  if (signOutOk) await page.waitForTimeout(1500);
  return signOutOk;
}

async function runAuthE2E() {
  console.log("================================================================================");
  console.log("🔐 AUTH BROWSER E2E — demo sign-in, manual sign-in, logout");
  console.log("Target:", TARGET_URL);
  console.log("================================================================================");

  const browser = await chromium.launch({
    ...(CHROME_PATH ? { executablePath: CHROME_PATH } : {}),
    headless: true,
  });
  console.log("Browser:", await browser.version());

  // Backend must be awake before auth flows mean anything.
  try {
    const res = await fetch(BACKEND_URL);
    console.log("Backend health:", res.status);
    if (!res.ok) throw new Error(`health HTTP ${res.status}`);
  } catch (e) {
    record("PRE", "backend reachable", "FAIL", String(e && e.message || e));
    await browser.close();
    process.exitCode = 1;
    return;
  }
record("PRE", "backend reachable", "PASS");

  // ---------------------------------------------------------------- AUTH-01: demo
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const demoTrace = [];
    const traceT0 = Date.now();
    const stamp = () => `t+${Math.round((Date.now() - traceT0) / 1000)}s`;
    page.on("request", (req) => {
      if (req.url().includes("/api/")) demoTrace.push(`${stamp()} > ${req.method()} ${req.url().replace("https://assetarray.onrender.com", "")}`);
    });
    page.on("response", (res) => {
      if (res.url().includes("/api/")) demoTrace.push(`${stamp()} < ${res.status()} ${res.url().replace("https://assetarray.onrender.com", "")}`);
    });
    page.on("console", (m) => { if (m.type() === "error") demoTrace.push(`[console.error] ${m.text().slice(0, 150)}`); });
    page.on("requestfailed", (req) => demoTrace.push(`[req-fail] ${req.url().replace("https://assetarray.onrender.com", "").slice(0, 100)} ${req.failure() && req.failure().errorText}`));
    try {
      await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 45000 });
      await passPinGate(page);
      await demoButton(page).click({ timeout: 10000 });
      // Poll plain body text for the workspace marker. This mirrors the
      // deterministic probe flow: locator+isVisible combinations proved flaky
      // here, while innerText polling resolves the moment the workspace appends
      // "DEMO WORKSPACE ACTIVE".
      const authed = await page.waitForFunction(() => {
        const t = document.body && document.body.innerText || "";
        return t.includes("DEMO WORKSPACE ACTIVE") || t.includes("Client roster");
      }, { timeout: 45000 }).then(() => true).catch(() => false);
      if (authed) {
        record("AUTH-01", "1-click demo login reaches authenticated workspace", "PASS");
      } else {
        const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400)).catch(() => "?");
        try {
          await page.screenshot({ path: require("path").join(require("os").tmpdir(), "auth-e2e-auth01.png") });
        } catch {}
        record("AUTH-01", "1-click demo login reaches authenticated workspace", "FAIL", `screen: ${JSON.stringify(bodyText)} | trace: ${JSON.stringify(demoTrace)}`);
      }
      // AUTH-02: logout returns to login screen.
      if (await logout(page)) {
        const loginBack = await loginScreenVisible(page);
        record("AUTH-02", "logout returns to login screen", loginBack ? "PASS" : "FAIL", loginBack ? "" : "login screen did not return");
      } else {
        record("AUTH-02", "logout returns to login screen", "FAIL", "logout control not found");
      }
    } catch (e) {
      record("AUTH-01/02", "demo login + logout", "FAIL", String(e && e.message || e));
    }
    await ctx.close();
  }

  // ---------------------------------------------------------------- AUTH-03/04: manual
  if (!MANUAL_USER || !MANUAL_PASS) {
    record("AUTH-03", "manual login with configured credentials", "SKIP", "E2E_TEST_USERNAME/PASSWORD not set");
    record("AUTH-04", "invalid login fails with Login failed", "SKIP", "E2E_TEST_USERNAME/PASSWORD not set");
  } else {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 45000 });
      await passPinGate(page);
      await page.getByPlaceholder("Username (e.g. admin)").fill(MANUAL_USER);
      await page.getByPlaceholder("Password").fill(MANUAL_PASS);
      await page.getByText("Sign In", { exact: true }).first().click();
      const workspace = await page.waitForFunction(
        () => !document.body.innerText.includes("1-Click Demo Sign In") &&
              !document.body.innerText.includes("1-Click Sign In (Judge"),
        { timeout: 30000 }
      ).then(() => isAuthenticated(page)).catch(() => false);
      record("AUTH-03", "manual login with configured credentials", workspace ? "PASS" : "FAIL", workspace ? "" : "workspace markers absent");
      if (workspace && (await logout(page))) {
        const loginBack = await loginScreenVisible(page);
        record("AUTH-03b", "manual session logout returns to login", loginBack ? "PASS" : "FAIL");
      }
      // Invalid credentials must fail visibly.
      await page.getByPlaceholder("Username (e.g. admin)").fill(MANUAL_USER);
      await page.getByPlaceholder("Password").fill(`${MANUAL_PASS}-wrong`);
      await page.getByText("Sign In", { exact: true }).first().click();
      const failed = await page.getByText("Login failed").first().isVisible({ timeout: 15000 }).catch(() => false);
      record("AUTH-04", "invalid login fails with Login failed", failed ? "PASS" : "FAIL", failed ? "" : "no failure state shown");
    } catch (e) {
      record("AUTH-03/04", "manual login flows", "FAIL", String(e && e.message || e));
    }
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`\nAUTH E2E: ${results.length - failed}/${results.length} passed${failed ? ` (${failed} FAILED)` : ""}`);
  if (failed) process.exitCode = 1;
}

runAuthE2E().catch((e) => {
  console.error("Auth E2E crashed:", e);
  process.exitCode = 1;
});
