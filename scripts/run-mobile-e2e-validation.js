const { chromium, devices } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const TARGET_URL = "https://asset-array.web.app";
const MOBILE_SCREENSHOT_DIR = path.join(__dirname, "..", "evidence", "screenshots", "mobile");
const REPORT_OUTPUT = path.join(__dirname, "..", "evidence", "workflow-results", "mobile-audit-results.json");

if (!fs.existsSync(MOBILE_SCREENSHOT_DIR)) {
  fs.mkdirSync(MOBILE_SCREENSHOT_DIR, { recursive: true });
}

// Helper: Ensure vault is unlocked and advisor workstation is active
async function ensureUnlocked(page) {
  const pinInput = page.locator('input[type="password"]').first();
  const isPinVisible = await pinInput.isVisible({ timeout: 2000 }).catch(() => false);
  if (isPinVisible) {
    await pinInput.fill("1234");
    const saveBtn = page.getByText("Save PIN & Enter").first();
    const unlockBtn = page.getByText("Unlock with PIN").first();

    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
    } else if (await unlockBtn.isVisible().catch(() => false)) {
      await unlockBtn.click();
    }
    await page.waitForTimeout(1500);
  }

  const quickSignIn = page.getByText("1-Click Sign In").or(page.getByText("Continue in Offline Mode")).first();
  const isAuthScreenVisible = await quickSignIn.isVisible({ timeout: 2000 }).catch(() => false);
  if (isAuthScreenVisible) {
    await quickSignIn.click();
    await page.waitForTimeout(2500);
  }
}

async function runMobileAudit() {
  console.log("================================================================================");
  console.log("📱 STARTING DEEP MOBILE WEB DEVICE EMULATION AUDIT (iPhone 13 & Pixel 7)");
  console.log("Target:", TARGET_URL);
  console.log("Devices: iPhone 13 (390x844, Touch), Pixel 7 (412x915, Touch)");
  console.log("================================================================================");

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const auditReport = {
    executedAt: new Date().toISOString(),
    environment: "mobile-device-emulation",
    devicesTested: ["iPhone 13 (390x844)", "Pixel 7 (412x915)"],
    screenAudits: [],
    overflowTests: [],
    touchTargetAudits: [],
    summary: { totalScreens: 0, passedScreens: 0, failedScreens: 0, horizontalOverflowViolations: 0 }
  };

  const testDevices = [
    { name: "iPhone 13", descriptor: devices["iPhone 13"] || { viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1", hasTouch: true, isMobile: true } },
    { name: "Pixel 7", descriptor: devices["Pixel 7"] || { viewport: { width: 412, height: 915 }, userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36", hasTouch: true, isMobile: true } },
  ];

  for (const dev of testDevices) {
    console.log(`\n--- Testing Device Emulation: ${dev.name} ---`);
    const context = await browser.newContext({
      ...dev.descriptor,
    });
    const page = await context.newPage();

    // 1. Boot / Login Screen
    await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1000);
    const bootScreenshot = path.join(MOBILE_SCREENSHOT_DIR, `${dev.name.toLowerCase().replace(/\s+/g, "_")}_01_login.png`);
    await page.screenshot({ path: bootScreenshot });

    const bootOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
    auditReport.overflowTests.push({ device: dev.name, screen: "Login/Lock", hasZeroHorizontalOverflow: bootOverflow });

    // Unlock
    await ensureUnlocked(page);
    await page.waitForTimeout(2000);

    // 2. Dashboard Screen
    const dashScreenshot = path.join(MOBILE_SCREENSHOT_DIR, `${dev.name.toLowerCase().replace(/\s+/g, "_")}_02_dashboard.png`);
    await page.screenshot({ path: dashScreenshot });
    const dashOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
    auditReport.overflowTests.push({ device: dev.name, screen: "Dashboard", hasZeroHorizontalOverflow: dashOverflow });
    console.log(`  ✓ Dashboard rendered (${dev.name}) - Zero Overflow: ${dashOverflow}`);

    // 3. Clients Screen
    const clientsTab = page.getByText("Clients").first();
    if (await clientsTab.isVisible()) {
      await clientsTab.click();
      await page.waitForTimeout(1500);
      const clientsScreenshot = path.join(MOBILE_SCREENSHOT_DIR, `${dev.name.toLowerCase().replace(/\s+/g, "_")}_03_clients.png`);
      await page.screenshot({ path: clientsScreenshot });
      const clientsOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
      auditReport.overflowTests.push({ device: dev.name, screen: "Clients", hasZeroHorizontalOverflow: clientsOverflow });
      console.log(`  ✓ Clients roster rendered (${dev.name}) - Zero Overflow: ${clientsOverflow}`);
    }

    // 4. Client 360 & Holdings Table
    const clientItem = page.locator("text=Rohan Varma").or(page.locator("text=Sharma")).or(page.locator("text=Varma")).first();
    if (await clientItem.isVisible()) {
      await clientItem.click();
      await page.waitForTimeout(1500);
      const c360Screenshot = path.join(MOBILE_SCREENSHOT_DIR, `${dev.name.toLowerCase().replace(/\s+/g, "_")}_04_client360_holdings.png`);
      await page.screenshot({ path: c360Screenshot });
      const c360Overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
      auditReport.overflowTests.push({ device: dev.name, screen: "Client360", hasZeroHorizontalOverflow: c360Overflow });
      console.log(`  ✓ Client 360 & Holdings rendered (${dev.name}) - Zero Overflow: ${c360Overflow}`);
    }

    // 5. Portfolios Screen
    const portfoliosTab = page.getByText("Portfolios").first();
    if (await portfoliosTab.isVisible()) {
      await portfoliosTab.click();
      await page.waitForTimeout(1500);
      const portScreenshot = path.join(MOBILE_SCREENSHOT_DIR, `${dev.name.toLowerCase().replace(/\s+/g, "_")}_05_portfolios.png`);
      await page.screenshot({ path: portScreenshot });
      const portOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
      auditReport.overflowTests.push({ device: dev.name, screen: "Portfolios", hasZeroHorizontalOverflow: portOverflow });
      console.log(`  ✓ Portfolios rendered (${dev.name}) - Zero Overflow: ${portOverflow}`);
    }

    // 6. Tools Screen (Calculators & Vault)
    const toolsTab = page.getByText("Tools").first();
    if (await toolsTab.isVisible()) {
      await toolsTab.click();
      await page.waitForTimeout(1500);
      const toolsScreenshot = path.join(MOBILE_SCREENSHOT_DIR, `${dev.name.toLowerCase().replace(/\s+/g, "_")}_06_tools.png`);
      await page.screenshot({ path: toolsScreenshot });
      const toolsOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
      auditReport.overflowTests.push({ device: dev.name, screen: "Tools", hasZeroHorizontalOverflow: toolsOverflow });
      console.log(`  ✓ Tools Suite rendered (${dev.name}) - Zero Overflow: ${toolsOverflow}`);
    }

    // 7. AI Research Screen
    const aiTab = page.getByText("AI Research").first();
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(1500);
      const aiScreenshot = path.join(MOBILE_SCREENSHOT_DIR, `${dev.name.toLowerCase().replace(/\s+/g, "_")}_07_ai_research.png`);
      await page.screenshot({ path: aiScreenshot });
      const aiOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
      auditReport.overflowTests.push({ device: dev.name, screen: "AI Research", hasZeroHorizontalOverflow: aiOverflow });
      console.log(`  ✓ AI Research rendered (${dev.name}) - Zero Overflow: ${aiOverflow}`);
    }

    // 8. Workspace / Advisor Command Center Screen
    const wsTab = page.getByText("Workspace").first();
    if (await wsTab.isVisible()) {
      await wsTab.click();
      await page.waitForTimeout(1500);
      const wsScreenshot = path.join(MOBILE_SCREENSHOT_DIR, `${dev.name.toLowerCase().replace(/\s+/g, "_")}_08_workspace.png`);
      await page.screenshot({ path: wsScreenshot });
      const wsOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
      auditReport.overflowTests.push({ device: dev.name, screen: "Workspace", hasZeroHorizontalOverflow: wsOverflow });
      console.log(`  ✓ Workspace Command Center rendered (${dev.name}) - Zero Overflow: ${wsOverflow}`);
    }

    // 9. Settings Screen
    const settingsTab = page.getByText("Settings").first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForTimeout(1500);
      const settingsScreenshot = path.join(MOBILE_SCREENSHOT_DIR, `${dev.name.toLowerCase().replace(/\s+/g, "_")}_09_settings.png`);
      await page.screenshot({ path: settingsScreenshot });
      const settingsOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
      auditReport.overflowTests.push({ device: dev.name, screen: "Settings", hasZeroHorizontalOverflow: settingsOverflow });
      console.log(`  ✓ Settings rendered (${dev.name}) - Zero Overflow: ${settingsOverflow}`);
    }

    // Touch Targets Dimension Check
    const touchTargetResults = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a, input, select'));
      const violations = [];
      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Flag if button is excessively small (less than 28x28)
          if (rect.width < 28 || rect.height < 28) {
            violations.push({
              tag: btn.tagName,
              text: (btn.innerText || btn.getAttribute('placeholder') || '').slice(0, 30),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            });
          }
        }
      }
      return { totalInteractive: buttons.length, smallTargets: violations.slice(0, 5) };
    });

    auditReport.touchTargetAudits.push({
      device: dev.name,
      ...touchTargetResults,
    });
    console.log(`  ✓ Touch targets checked (${dev.name}): ${touchTargetResults.totalInteractive} elements inspected.`);

    await context.close();
  }

  await browser.close();

  auditReport.summary.totalScreens = auditReport.overflowTests.length;
  auditReport.summary.passedScreens = auditReport.overflowTests.filter(t => t.hasZeroHorizontalOverflow).length;
  auditReport.summary.failedScreens = auditReport.overflowTests.filter(t => !t.hasZeroHorizontalOverflow).length;
  auditReport.summary.horizontalOverflowViolations = auditReport.summary.failedScreens;

  fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(auditReport, null, 2), "utf-8");
  console.log("\n================================================================================");
  console.log(`🏁 MOBILE DEVICE EMULATION AUDIT COMPLETED: ${auditReport.summary.passedScreens}/${auditReport.summary.totalScreens} SCREENS PASSED`);
  console.log("Report saved to:", REPORT_OUTPUT);
  console.log("================================================================================");
}

runMobileAudit().catch((err) => {
  console.error("FATAL ERROR IN MOBILE AUDIT:", err);
  process.exit(1);
});
