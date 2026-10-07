const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const TARGET_URL = process.env.E2E_BASE_URL || "https://asset-array.web.app";
const SCREENSHOT_DIR = path.join(__dirname, "..", "docs", "uat-evidence", "screenshots");

async function ensureUnlocked(page) {
  await page.waitForTimeout(1000);
  const pinInput = page.locator('input[type="password"]').first();
  const isPinVisible = await pinInput.isVisible({ timeout: 2500 }).catch(() => false);
  if (isPinVisible) {
    console.log("  [Auth] Entering E2E PIN...");
    await pinInput.fill(process.env.E2E_TEST_PIN || "1234");
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
  const isAuthScreenVisible = await loginScreen.isVisible({ timeout: 2500 }).catch(() => false);
  if (isAuthScreenVisible) {
    console.log("  [Auth] Signing in with default credentials...");
    await page.getByPlaceholder("Username (e.g. admin)").fill(process.env.E2E_TEST_USERNAME || "admin");
    await page.getByPlaceholder("Password").fill(process.env.E2E_TEST_PASSWORD || "AssetArrayLocalAdmin2026");
    await page.getByText("Sign In", { exact: true }).first().click();
    await page.waitForFunction(
      () => !document.body.innerText.includes("Sign in to your advisor workspace"),
      { timeout: 30000 }
    );
    await page.waitForTimeout(1500);
  }
}

async function verifyWorkspace() {
  console.log("================================================================================");
  console.log("🧪 TESTING LIVE WORKSPACE SCREEN ON BROWSER:", TARGET_URL);
  console.log("================================================================================");

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  console.log("1. Navigating to application...");
  await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 30000 });
  await ensureUnlocked(page);

  console.log("2. Navigating to Workspace tab...");
  const workspaceNav = page.getByText("Workspace", { exact: true }).first();
  await workspaceNav.waitFor({ state: "visible", timeout: 10000 });
  await workspaceNav.click();
  await page.waitForTimeout(1000);

  console.log("3. Verifying Desktop Layout of Advisor Portal and Data Aggregation...");
  const portalHeading = page.getByText("Secure advisor portal").first();
  const aggHeading = page.getByText("Automated data aggregation").first();

  await portalHeading.waitFor({ state: "visible", timeout: 5000 });
  await aggHeading.waitFor({ state: "visible", timeout: 5000 });

  const portalBox = await portalHeading.boundingBox();
  const aggBox = await aggHeading.boundingBox();

  console.log(`   - Portal position: x=${portalBox.x.toFixed(1)}, y=${portalBox.y.toFixed(1)}`);
  console.log(`   - Aggregation position: x=${aggBox.x.toFixed(1)}, y=${aggBox.y.toFixed(1)}`);

  if (aggBox.x <= portalBox.x + 100) {
    throw new Error(`FAIL: Columns are not side-by-side on desktop! Portal x=${portalBox.x}, Agg x=${aggBox.x}`);
  }
  console.log("   ✓ Confirmed side-by-side desktop dual-column layout!");

  console.log("4. Verifying Save Draft button bounds and visibility...");
  const saveDraftText = page.getByText("Save Draft", { exact: true }).first();
  await saveDraftText.waitFor({ state: "visible", timeout: 5000 });
  const saveDraftBtn = saveDraftText.locator("..");
  const btnBox = await saveDraftBtn.boundingBox();
  console.log(`   - Save Draft button size: width=${btnBox.width.toFixed(1)}, height=${btnBox.height.toFixed(1)}`);
  if (btnBox.height < 35) {
    throw new Error(`FAIL: Save Draft button height is clipped! Height = ${btnBox.height}`);
  }
  console.log("   ✓ Confirmed Save Draft button is fully rendered and not clipped!");

  console.log("5. Verifying 'No advisor drafts yet' empty state...");
  const emptyStateText = page.getByText("No advisor drafts yet").first();
  await emptyStateText.waitFor({ state: "visible", timeout: 5000 });
  const emptyBox = await emptyStateText.boundingBox();
  if (emptyBox.y <= btnBox.y) {
    throw new Error(`FAIL: Empty state is overlapping with Save Draft button!`);
  }
  console.log("   ✓ Confirmed empty state renders cleanly below the button!");

  console.log("6. Testing Draft Creation Interaction...");
  await page.getByPlaceholder("Client name").fill("Dr. Rajesh Patel");
  await page.getByPlaceholder("Message title").fill("Quarterly Advisory Memo");
  await page.getByPlaceholder("Secure advisor message draft").fill("Portfolio rebalancing review complete. All allocations within target drift bands.");
  await saveDraftBtn.click();
  await page.waitForTimeout(1000);

  const draftCardTitle = page.getByText("Quarterly Advisory Memo").first();
  await draftCardTitle.waitFor({ state: "visible", timeout: 5000 });
  console.log("   ✓ Confirmed draft successfully created and rendered in advisor workspace!");

  const screenshotPath = path.join(SCREENSHOT_DIR, "workspace-desktop-verified.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`   ✓ Desktop screenshot captured at: ${screenshotPath}`);

  console.log("7. Verifying Responsive Mobile Viewport in fresh mobile device context...");
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 30000 });
  await ensureUnlocked(mobilePage);

  const mobileWorkspaceNav = mobilePage.getByText("More", { exact: true }).first();
  await mobileWorkspaceNav.waitFor({ state: "visible", timeout: 10000 });
  await mobileWorkspaceNav.click();
  await mobilePage.waitForTimeout(1500);

  const mPortal = mobilePage.getByText("Secure advisor portal").first();
  const mAgg = mobilePage.getByText("Automated data aggregation").first();

  const portalTop = await mPortal.evaluate((el) => el.getBoundingClientRect().top);
  const aggTop = await mAgg.evaluate((el) => el.getBoundingClientRect().top);
  console.log(`   - Mobile Y Coordinates: Portal=${portalTop.toFixed(1)}, Aggregation=${aggTop.toFixed(1)}`);
  if (aggTop <= portalTop + 300) {
    throw new Error(`FAIL: On mobile, aggregation is not below portal! Portal Y=${portalTop}, Agg Y=${aggTop}`);
  }
  console.log(`   ✓ Confirmed clean vertical stacking with zero collision on mobile (gap = ${(aggTop - portalTop).toFixed(0)}px)!`);

  const mobileScreenshotPath = path.join(SCREENSHOT_DIR, "workspace-mobile-verified.png");
  await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: true });
  console.log(`   ✓ Mobile screenshot captured at: ${mobileScreenshotPath}`);

  await mobileContext.close();
  await context.close();
  await browser.close();
  console.log("\n================================================================================");
  console.log("🎉 ALL WORKSPACE BROWSER TESTS PASSED FLAWLESSLY!");
  console.log("================================================================================");
}

verifyWorkspace().catch((err) => {
  console.error("\n❌ TEST ERROR:", err);
  process.exit(1);
});
