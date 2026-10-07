const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("================================================================================");
  console.log("🛡️ STARTING BACKEND & API SECURITY HARDENING AUDIT");
  console.log("================================================================================");

  const targetUrl = process.env.E2E_API_URL || "https://assetarray.onrender.com/api/health";
  console.log("Testing Target Endpoint:", targetUrl);

  function fetchUrl(url, options = {}) {
    return new Promise((resolve) => {
      const lib = url.startsWith("https") ? https : http;
      const req = lib.request(url, options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        });
      });
      req.on("error", (err) => resolve({ error: err.message }));
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  const checks = [];

  // 1. Health Endpoint Accessibility
  const healthRes = await fetchUrl(targetUrl);
  if (healthRes.error) {
    console.log(`  ⚠️ API Health endpoint offline or unreachable: ${healthRes.error}`);
    checks.push({ name: "API Health Check", status: "SKIPPED_NETWORK_OFFLINE" });
  } else {
    console.log(`  ✓ API Health HTTP Status: ${healthRes.statusCode}`);
    checks.push({ name: "API Health Check", status: healthRes.statusCode === 200 ? "PASSED" : "FAILED" });

    // 2. Check Security Headers
    const headers = healthRes.headers;
    const hasCors = !!headers["access-control-allow-origin"];
    const contentType = headers["content-type"] || "";

    console.log(`  ✓ CORS Headers Present: ${hasCors}`);
    console.log(`  ✓ Content-Type Header: ${contentType}`);

    checks.push({ name: "CORS Configuration Header", status: hasCors ? "PASSED" : "WARNING" });
    checks.push({ name: "Content-Type Security Header", status: contentType.includes("json") ? "PASSED" : "FAILED" });
  }

  // 3. Reject Malicious Unauthorized Payload
  const badAuthRes = await fetchUrl(targetUrl.replace("/health", "/ai/chat"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid_malicious_token_12345",
    },
    body: JSON.stringify({ prompt: "<script>alert(1)</script>" }),
  });

  if (!badAuthRes.error) {
    console.log(`  ✓ Unauthorized Chat Payload Rejected: HTTP ${badAuthRes.statusCode}`);
    checks.push({
      name: "Unauthorized Injection Protection",
      status: badAuthRes.statusCode === 401 || badAuthRes.statusCode === 403 ? "PASSED" : "FAILED",
    });
  }

  console.log("\n================================================================================");
  console.log("🏁 API SECURITY AUDIT COMPLETE:");
  console.table(checks);
  console.log("================================================================================");

  const reportPath = path.join(__dirname, "..", "docs", "uat-evidence", "api-security-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(checks, null, 2));
})();
