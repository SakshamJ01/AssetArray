const { chromium, firefox, webkit } = require("playwright-core");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("================================================================================");
  console.log("🌐 STARTING CROSS-BROWSER MATRIX TESTING (CHROMIUM, FIREFOX, WEBKIT)");
  console.log("================================================================================");

  const url = process.env.E2E_BASE_URL || "https://asset-array.web.app";
  const engines = [
    { name: "Chromium", launcher: chromium },
    { name: "Firefox", launcher: firefox },
    { name: "WebKit (Safari Engine)", launcher: webkit },
  ];

  const summary = [];

  for (const engine of engines) {
    console.log(`\n▶ Testing Browser Engine: ${engine.name}...`);
    try {
      const browser = await engine.launcher.launch({ headless: true }).catch(() => null);
      if (!browser) {
        console.log(`  ⚠️ Engine ${engine.name} binary not locally available, skipping engine launch.`);
        summary.push({ engine: engine.name, status: "SKIPPED_BINARY_MISSING" });
        continue;
      }

      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });

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
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1000);

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

      const title = await page.title();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      console.log(`  ✓ ${engine.name} -> Title: "${title}", scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`);
      summary.push({
        engine: engine.name,
        status: "PASSED",
        title,
        zeroOverflow: scrollWidth <= clientWidth,
      });

      await browser.close();
    } catch (err) {
      console.error(`  ✗ ${engine.name} failed:`, err.message);
      summary.push({ engine: engine.name, status: "FAILED", error: err.message });
    }
  }

  console.log("\n================================================================================");
  console.log("🏁 CROSS-BROWSER MATRIX SUMMARY:");
  console.table(summary);
  console.log("================================================================================");

  const reportPath = path.join(__dirname, "..", "docs", "uat-evidence", "cross-browser-matrix-results.json");
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
})();
