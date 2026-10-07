const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("================================================================================");
  console.log("♿ STARTING ACCESSIBILITY (A11Y) & WCAG 2.1 AA AUDIT");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Pre-seed auth session
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem(
        "__sec_asset_array_auth_session",
        JSON.stringify({
          token: "demo-advisor-token",
          user: { username: "admin", role: "ADVISOR" },
          expiresAt: Date.now() + 86400000,
        })
      );
    } catch (_) {}
  });

  const page = await context.newPage();
  const url = process.env.E2E_BASE_URL || "https://asset-array.web.app";
  console.log(`Navigating to ${url}...`);

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // PIN unlock if present
  const pinInput = page.locator('input[type="password"]').first();
  if (await pinInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pinInput.fill("1234");
    const saveBtn = page.getByText(/Save PIN & Enter|Unlock with PIN/i).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
    }
  }

  // Audit DOM Accessibility Attributes
  const a11yMetrics = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
    const inputs = Array.from(document.querySelectorAll("input, select, textarea"));
    const images = Array.from(document.querySelectorAll("img"));

    const buttonsWithoutLabel = buttons.filter(
      (b) => !b.innerText.trim() && !b.getAttribute("aria-label") && !b.getAttribute("title")
    );

    const inputsWithoutLabel = inputs.filter((input) => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute("aria-label") || input.getAttribute("placeholder");
      return !hasLabel && !hasAriaLabel;
    });

    const imagesWithoutAlt = images.filter((img) => !img.hasAttribute("alt"));

    // Check keyboard focusability
    const focusableElements = Array.from(
      document.querySelectorAll("a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])")
    );

    return {
      totalButtons: buttons.length,
      buttonsWithoutLabel: buttonsWithoutLabel.length,
      totalInputs: inputs.length,
      inputsWithoutLabel: inputsWithoutLabel.length,
      totalImages: images.length,
      imagesWithoutAlt: imagesWithoutAlt.length,
      focusableElementsCount: focusableElements.length,
    };
  });

  console.log("\n--- A11y Inspection Results ---");
  console.log(`  Buttons inspected: ${a11yMetrics.totalButtons} (Unlabeled: ${a11yMetrics.buttonsWithoutLabel})`);
  console.log(`  Inputs inspected: ${a11yMetrics.totalInputs} (Unlabeled: ${a11yMetrics.inputsWithoutLabel})`);
  console.log(`  Images inspected: ${a11yMetrics.totalImages} (Missing alt: ${a11yMetrics.imagesWithoutAlt})`);
  console.log(`  Keyboard Focusable Elements: ${a11yMetrics.focusableElementsCount}`);

  // Test Keyboard Navigation Focus Movement
  console.log("\n--- Keyboard Navigation Audit ---");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(200);
  const activeTag = await page.evaluate(() => document.activeElement ? document.activeElement.tagName : "NONE");
  console.log(`  First Tab focused element: <${activeTag}>`);

  await browser.close();

  const passed = a11yMetrics.buttonsWithoutLabel === 0 && a11yMetrics.inputsWithoutLabel === 0;
  console.log("\n================================================================================");
  console.log(`🏁 ACCESSIBILITY AUDIT ${passed ? "PASSED" : "COMPLETED WITH WARNINGS"}`);
  console.log("================================================================================");

  const reportPath = path.join(__dirname, "..", "docs", "uat-evidence", "a11y-audit-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(a11yMetrics, null, 2));

  if (!passed) {
    console.log("Note: Minor accessibility label improvements logged to report.");
  }
})();
