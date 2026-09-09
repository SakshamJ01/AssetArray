/**
 * Forensic product QA engine (3.3.x): real-browser, per-element geometry audit.
 * - Authenticated via local PIN gate + advisor login (stubbed locally for
 *   geometry QA — no synthetic sessions, no demo identity).
 * - Per viewport x per tab: page overflow, per-element clipping/offscreen,
 *   text-collapse detection (tiny/vertical text containers), overlap detection,
 *   touch-target audit, screenshots.
 * - Writes JSON report to FORENSIC_REPORT (default: os.tmpdir()/forensic-qa.json).
 * Env: E2E_BASE_URL, E2E_API_URL, E2E_TEST_PIN, E2E_TEST_USERNAME,
 *   E2E_TEST_PASSWORD (live login), CHROME_PATH (optional),
 *   FORENSIC_VIEWPORTS (e.g. "360x800,390x844"), STUB_AUTH=1 (geometry QA only).
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME_PATH = process.env.CHROME_PATH || null;
const TARGET_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:8123/";
const BACKEND_URL = process.env.E2E_API_URL || "https://assetarray.onrender.com/api/health";
const E2E_PIN = process.env.E2E_TEST_PIN || "1234";
const MANUAL_USER = process.env.E2E_TEST_USERNAME || "";
const MANUAL_PASS = process.env.E2E_TEST_PASSWORD || "";
const REPORT_PATH = process.env.FORENSIC_REPORT || path.join(os.tmpdir(), "forensic-qa.json");
const SHOT_DIR = process.env.FORENSIC_SHOTS || path.join(os.tmpdir(), "forensic-shots");
// STUB_AUTH=1: fulfill auth endpoints locally (UI-geometry QA only — the live
// backend rejects cross-origin localhost. API truth is covered separately by
// direct HTTPS checks + backend unit tests, and is recorded in the report).
const STUB_AUTH = process.env.STUB_AUTH === "1";
const STUB_USER = { id: "qa-advisor", username: "qa-smoke", role: "advisor", active: true };
const STUB_TOKENS = { accessToken: "stub-access", refreshToken: "stub-refresh", expiresIn: 900 };

async function stubAuthRoutes(page) {
  await page.route("**/api/auth/login", (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204 });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, user: STUB_USER, ...STUB_TOKENS }) });
  });
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, user: STUB_USER }) })
  );
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, user: STUB_USER, ...STUB_TOKENS }) })
  );
}

const VIEWPORTS = (process.env.FORENSIC_VIEWPORTS || "360x800,390x844,412x915,768x1024,1440x900")
  .split(",")
  .map((s) => {
    const [w, h] = s.trim().split("x").map(Number);
    return { width: w, height: h, label: `${w}x${h}` };
  });

const MOBILE_TABS = ["Home", "Clients", "Portfolio", "Research", "More"];
const DESKTOP_TABS = ["Dashboard", "Clients", "Portfolios", "Tools", "Workspace", "Settings", "AI Research"];

const findings = [];
function finding(viewport, tab, kind, severity, detail) {
  findings.push({ viewport, tab, kind, severity, detail });
  console.log(`  [${severity}] [${viewport}/${tab}] ${kind}: ${detail.slice(0, 160)}`);
}

async function passPinGate(page) {
  const pinInput = page.locator('input[type="password"]').first();
  if (await pinInput.isVisible({ timeout: 8000 }).catch(() => false)) {
    await pinInput.fill(E2E_PIN);
    const saveBtn = page.getByText("Save PIN & Enter").first();
    const unlockBtn = page.getByText("Unlock with PIN").first();
    if (await saveBtn.isVisible().catch(() => false)) await saveBtn.click();
    else if (await unlockBtn.isVisible().catch(() => false)) await unlockBtn.click();
    await page.waitForTimeout(1500);
  }
}

async function login(page, viewportLabel) {
  if (!STUB_AUTH) {
    if (!MANUAL_USER || !MANUAL_PASS) {
      throw new Error("E2E_TEST_USERNAME/E2E_TEST_PASSWORD required when STUB_AUTH is not set");
    }
  }
  await page.getByPlaceholder("Username (e.g. admin)").fill(MANUAL_USER || STUB_USER.username);
  await page.getByPlaceholder("Password").fill(MANUAL_PASS || "stub-password");
  await page.getByText("Sign In", { exact: true }).first().click();
  try {
    await page.waitForFunction(
      () => !document.body.innerText.includes("Sign in to your advisor workspace"),
      { timeout: 45000 }
    );
  } catch (e) {
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500)).catch(() => "?");
    try {
      await page.screenshot({ path: path.join(SHOT_DIR, `${viewportLabel}-authfail.png`) });
    } catch {}
    throw new Error(`login did not complete. screen: ${JSON.stringify(bodyText)}`);
  }
}

async function scanTab(page, viewport, tab) {
  await page.waitForTimeout(1200);
  const vw = viewport.width;
  const shot = path.join(SHOT_DIR, `${viewport.label}-${tab.replace(/\s+/g, "")}.png`);
  await page.screenshot({ path: shot, fullPage: false }).catch(() => {});

  const data = await page.evaluate(() => {
    const out = { pageOverflow: 0, elements: [], buttons: [] };
    out.pageOverflow = document.documentElement.scrollWidth - window.innerWidth;
    const inScrollable = (el) => {
      let n = el.parentElement;
      while (n && n.tagName !== "BODY") {
        const cs = getComputedStyle(n);
        if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 1) return true;
        n = n.parentElement;
      }
      return false;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    const els = [];
    while (walker.nextNode()) els.push(walker.currentNode);
    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const text = (el.innerText || "").trim().replace(/\s+/g, " ");
      const scrollable = inScrollable(el);
      // Leaf-ish text containers only (avoid whole-page wrappers).
      const kids = el.children.length;
      if (text && text.length >= 2 && kids <= 2) {
        out.elements.push({
          tag: el.tagName,
          text: text.slice(0, 120),
          len: text.length,
          x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height),
          right: Math.round(r.right), bottom: Math.round(r.bottom),
          fontSize: style.fontSize,
          scrollable,
        });
      }
      const role = el.getAttribute("role");
      const interactive = el.tagName === "BUTTON" || el.tagName === "A" || role === "button";
      if (interactive) {
        out.buttons.push({
          text: text.slice(0, 60),
          x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height),
          right: Math.round(r.right), bottom: Math.round(r.bottom),
          scrollable,
        });
      }
    }
    return out;
  });

  if (data.pageOverflow > 1) {
    finding(viewport.label, tab, "page-overflow", "P1", `page scrollWidth exceeds viewport by ${data.pageOverflow}px`);
  }
  const area = (b) => Math.max(0, b.w) * Math.max(0, b.h);
  let collapse = 0, vertical = 0, offscreen = 0;
  for (const el of data.elements) {
    if (el.scrollable) continue; // intentional horizontal scroll (§17 whitelist)
    // Text-collapse: long text squeezed into a tiny box (chars stack vertically).
    if (el.w < 48 && el.len > 10) {
      collapse++;
      if (collapse <= 5) finding(viewport.label, tab, "text-collapse", "P0", `${el.tag} w=${el.w} len=${el.len} "${el.text}"`);
    }
    // Vertical-stack signature: tall narrow box with short text.
    if (el.w > 0 && el.h > el.w * 4 && el.len > 2 && el.len < 30 && el.w < 32) {
      vertical++;
      if (vertical <= 5) finding(viewport.label, tab, "vertical-text", "P0", `${el.tag} ${el.w}x${el.h} "${el.text}"`);
    }
    if (el.x >= vw || el.right <= 0) {
      offscreen++;
      if (offscreen <= 3) finding(viewport.label, tab, "offscreen-element", "P1", `${el.tag} x=${el.x} right=${el.right} "${el.text}"`);
    } else if (el.right > vw + 1 && el.w > 4) {
      // Right-edge bleed (ignore hairline rounding).
      finding(viewport.label, tab, "right-bleed", "P2", `${el.tag} right=${el.right} vw=${vw} "${el.text}"`);
    }
  }
  if (collapse > 5) finding(viewport.label, tab, "text-collapse", "P0", `${collapse} collapsed text containers total`);
  if (vertical > 5) finding(viewport.label, tab, "vertical-text", "P0", `${vertical} vertical-stack containers total`);

  // Overlap among interactive elements (skip ancestor/descendant containment).
  const btns = data.buttons.filter((b) => b.w > 0 && b.h > 0 && !b.scrollable);
  const contains = (a, b) => {
    const ix = Math.min(a.right, b.right) - Math.max(a.x, b.x);
    const iy = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
    if (ix <= 0 || iy <= 0) return 0;
    return (ix * iy) / Math.min(area(a), area(b));
  };
  let overlaps = 0;
  for (let i = 0; i < btns.length; i++) {
    for (let j = i + 1; j < btns.length; j++) {
      const a = btns[i], b = btns[j];
      const ix = Math.min(a.right, b.right) - Math.max(a.x, b.x);
      const iy = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      if (ix > 4 && iy > 4 && contains(a, b) < 0.85) {
        overlaps++;
        if (overlaps <= 4) finding(viewport.label, tab, "overlap", "P1", `"${a.text}" overlaps "${b.text}"`);
      }
    }
  }

  // Touch targets on mobile widths.
  if (vw < 768) {
    const small = btns.filter((b) => b.h < 44 || b.w < 44);
    if (small.length > 0) {
      finding(viewport.label, tab, "touch-target", "P2", `${small.length}/${btns.length} controls under 44px (e.g. "${small[0].text}" ${small[0].w}x${small[0].h})`);
    }
  }
  return { buttons: btns.length, elements: data.elements.length, overflow: data.pageOverflow };
}

async function run() {
  console.log("================================================================================");
  console.log("🔬 FORENSIC QA — per-element responsive audit");
  console.log("Target:", TARGET_URL, "| viewports:", VIEWPORTS.map((v) => v.label).join(", "));
  console.log("================================================================================");
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ ...(CHROME_PATH ? { executablePath: CHROME_PATH } : {}), headless: true });
  const summary = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    if (STUB_AUTH) await stubAuthRoutes(page);
    try {
      await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 45000 });
      await passPinGate(page);
      await login(page, vp.label);
      await page.waitForTimeout(2000);
      const tabs = vp.width >= 1024 ? DESKTOP_TABS : MOBILE_TABS;
      for (const tab of tabs) {
        try {
          const el = page.getByText(tab, { exact: true }).first();
          if (await el.isVisible({ timeout: 5000 }).catch(() => false)) {
            await el.click();
            await page.waitForTimeout(800);
          }
          const stats = await scanTab(page, vp, tab);
          summary.push({ viewport: vp.label, tab, ...stats, status: "SCANNED" });
          // Selected-client state: tap the first roster row (if any) and scan
          // again — selected state changes the status bar, 360 panels, and
          // downstream tabs, and must be covered, not assumed.
          if (tab === "Clients" || tab === "Home" || tab === "Dashboard") {
            // Select the first real client row if one exists (honest roster
            // may legitimately be empty on a fresh workspace).
            const firstRow = page.locator("text=/[A-Z][a-z]+ [A-Z][a-z]+/").first();
            if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
              await firstRow.scrollIntoViewIfNeeded().catch(() => {});
              await firstRow.click({ timeout: 8000 }).catch(() => {});
              await page.waitForTimeout(1200);
              const s2 = await scanTab(page, vp, `${tab}+selected`);
              summary.push({ viewport: vp.label, tab: `${tab}+selected`, ...s2, status: "SCANNED" });
              // Close any modal opened by selection (Escape = topmost layer).
              await page.keyboard.press("Escape").catch(() => {});
              await page.waitForTimeout(600);
            }
          }
        } catch (e) {
          summary.push({ viewport: vp.label, tab, status: "NOT_TESTED", reason: String(e && e.message || e).slice(0, 120) });
          finding(vp.label, tab, "tab-not-testable", "P1", String(e && e.message || e).slice(0, 160));
        }
      }
    } catch (e) {
      summary.push({ viewport: vp.label, tab: "(auth)", status: "FAILED", reason: String(e && e.message || e).slice(0, 160) });
      finding(vp.label, "(auth)", "auth-flow", "P0", String(e && e.message || e).slice(0, 200));
    }
    await ctx.close();
  }
  await browser.close();
  const report = { executedAt: new Date().toISOString(), target: TARGET_URL, stubAuth: STUB_AUTH, summary, findings };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  const p0 = findings.filter((f) => f.severity === "P0").length;
  const p1 = findings.filter((f) => f.severity === "P1").length;
  console.log(`\nFORENSIC: ${summary.length} tab-scans, ${findings.length} findings (P0:${p0} P1:${p1}). Report: ${REPORT_PATH} Shots: ${SHOT_DIR}`);
  if (p0 > 0) process.exitCode = 1;
}

run().catch((e) => { console.error("Forensic crashed:", e); process.exitCode = 1; });
