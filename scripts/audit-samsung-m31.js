const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    channel: "chrome"
  });
  
  // Samsung Galaxy M31 Specs:
  // Screen: 1080 x 2340 pixels, 19.5:9 ratio (~403 ppi)
  // Viewport in Android Chrome: 412 x 892 px, Device Scale Factor: 2.625
  const context = await browser.newContext({
    viewport: { width: 412, height: 892 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 12; SM-M315F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
  });
  const page = await context.newPage();
  
  const outputDir = path.join(__dirname, "..", "evidence", "screenshots", "samsung_m31");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Navigating to https://asset-array.web.app...");
  await page.goto("https://asset-array.web.app", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Check PIN
  const pinInput = page.locator('input[type="password"]').first();
  const isPin = await pinInput.isVisible({ timeout: 2000 }).catch(() => false);
  if (isPin) {
    const isSetup = await page.getByText("Save PIN & Enter").isVisible({ timeout: 500 }).catch(() => false);
    console.log("Entering PIN (setup:", isSetup, ")...");
    await pinInput.fill("1234");
    const saveBtn = page.getByText(/Save PIN & Enter|Unlock with PIN/i).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Check Cloud Login
  const loginPrompt = page.getByText("Sign in to your advisor workspace").first();
  const isLoginVisible = await loginPrompt.isVisible({ timeout: 3000 }).catch(() => false);
  if (isLoginVisible) {
    console.log("Entering Cloud Credentials...");
    await page.getByPlaceholder("Username (e.g. admin)").fill("admin");
    await page.getByPlaceholder("Password").fill("AssetArrayLocalAdmin2026");
    const signInBtn = page.getByText("Sign In", { exact: true }).first();
    await signInBtn.click();
    console.log("Waiting for workspace to load...");
    await page.waitForFunction(() => !document.body.innerText.includes("Sign in to your advisor workspace"), { timeout: 30000 });
    await page.waitForTimeout(2500);
  }

  console.log("Capturing Dashboard...");
  await page.screenshot({ path: path.join(outputDir, "01_dashboard.png") });

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  console.log(`Samsung M31 (412x892) Dashboard -> scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}, Zero Overflow: ${scrollWidth <= clientWidth}`);

  // Navigate to Clients
  console.log("Capturing Clients...");
  const clientsTab = page.getByText("Clients", { exact: true }).last();
  if (await clientsTab.isVisible().catch(() => false)) {
    await clientsTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, "02_clients.png") });
  }

  // Navigate to Portfolio
  console.log("Capturing Portfolio...");
  const portfolioTab = page.getByText("Portfolio", { exact: true }).last();
  if (await portfolioTab.isVisible().catch(() => false)) {
    await portfolioTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, "03_portfolio.png") });
  }

  // Navigate to Research
  console.log("Capturing Research...");
  const researchTab = page.getByText("Research", { exact: true }).last();
  if (await researchTab.isVisible().catch(() => false)) {
    await researchTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, "04_ai_research.png") });
  }

  // Navigate to More
  console.log("Capturing More...");
  const moreTab = page.getByText("More", { exact: true }).last();
  if (await moreTab.isVisible().catch(() => false)) {
    await moreTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, "05_more.png") });
  }

  await browser.close();
  console.log("Samsung Galaxy M31 audit completed successfully.");
})();
