/**
 * AssetArray Master Product-Wide Verification Runner
 * Runs:
 * 1. Unit & Integration tests (npm test)
 * 2. TypeScript type check (npm run typecheck)
 * 3. Server syntax check (node --check backend/server.js)
 * 4. AI integration & safety audit (npm run test:ai:integration)
 * 5. Production Web Desktop E2E (npm run test:e2e)
 * 6. Mobile Web Device Emulation E2E (npm run test:e2e:mobile)
 * 7. Web Production Export / Build (npm run build:web)
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("================================================================================");
  console.log("🚀 STARTING ASSETARRAY MASTER VERIFICATION SUITE (VERIFY:ALL)");
  console.log("================================================================================");

  const startTime = Date.now();
  const summary = {
    timestamp: new Date().toISOString(),
    steps: [],
    overallStatus: "PASSED",
  };

  function runStep(name, command, continueOnFail = false) {
    console.log(`\n▶ Running Step: ${name} [${command}]...`);
    const stepStart = Date.now();
    try {
      const output = execSync(command, { encoding: "utf-8", stdio: "inherit" });
      const durationSec = ((Date.now() - stepStart) / 1000).toFixed(1);
      summary.steps.push({ name, command, status: "PASSED", durationSec });
      console.log(`  ✓ ${name} PASSED in ${durationSec}s`);
      return true;
    } catch (err) {
      const durationSec = ((Date.now() - stepStart) / 1000).toFixed(1);
      summary.steps.push({ name, command, status: "FAILED", durationSec, error: err.message });
      console.error(`  ✗ ${name} FAILED in ${durationSec}s`);
      if (!continueOnFail) {
        summary.overallStatus = "FAILED";
      }
      return false;
    }
  }

  // 1. TypeScript Check
  runStep("TypeScript Static Type Check", "npm run typecheck");

  // 2. Backend Server Check
  runStep("Backend Server Syntax Validation", "node --check backend/server.js");

  // 3. Unit & Integration Tests (Jest)
  runStep("Unit & Integration Test Suites", "npm test");

  // 4. AI Integration & Safety Audit
  runStep("AI Integration & Grounding Audit", "node scripts/run-ai-integration-test.js");

  // 5. Desktop Browser E2E
  runStep("Desktop Web E2E Validation", "node scripts/run-e2e-browser-validation.js");

  // 6. Mobile Web Device Emulation E2E
  runStep("Mobile Device Emulation Audit", "node scripts/run-mobile-e2e-validation.js");

  // 7. Web Production Build
  runStep("Production Web Export & Build", "npm run build:web");

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n================================================================================");
  console.log(`🏁 MASTER VERIFICATION COMPLETE: ${summary.overallStatus} in ${totalDuration}s`);
  console.log("================================================================================");

  const reportPath = path.join(__dirname, "../docs/full-system-verification/master-run-summary.json");
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  if (summary.overallStatus === "FAILED") {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Master verification crashed:", e);
  process.exit(1);
});
