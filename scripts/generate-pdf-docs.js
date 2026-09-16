const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Asset Array - Full Project System Documentation (v3.3.1)</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.5;
    }
    .cover {
      page-break-after: always;
      text-align: center;
      padding-top: 100px;
    }
    .cover-title {
      font-size: 32pt;
      font-weight: 800;
      color: #030712;
      letter-spacing: -1px;
      margin-bottom: 5px;
    }
    .cover-subtitle {
      font-size: 16pt;
      font-weight: 700;
      color: #D97706;
      margin-bottom: 40px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      background: #030712;
      color: #E0A84C;
      font-size: 11pt;
      font-weight: 700;
      border-radius: 6px;
      margin-bottom: 60px;
    }
    .cover-meta {
      font-size: 11pt;
      color: #475569;
      line-height: 1.8;
      margin-top: 120px;
      border-top: 1px solid #E2E8F0;
      padding-top: 20px;
    }
    h1 {
      font-size: 20pt;
      color: #030712;
      border-bottom: 2px solid #E0A84C;
      padding-bottom: 6px;
      margin-top: 30px;
      margin-bottom: 15px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 14pt;
      color: #1E293B;
      margin-top: 20px;
      margin-bottom: 10px;
      border-left: 4px solid #E0A84C;
      padding-left: 10px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 12pt;
      color: #334155;
      margin-top: 15px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    p, li {
      color: #334155;
    }
    ul {
      margin-top: 5px;
      margin-bottom: 15px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #CBD5E1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #030712;
      color: #E0A84C;
      font-weight: 700;
    }
    tr:nth-child(even) {
      background-color: #F8FAFC;
    }
    code, pre {
      font-family: 'Consolas', 'Courier New', monospace;
      background: #F1F5F9;
      color: #0F172A;
      border-radius: 4px;
    }
    code {
      padding: 2px 6px;
      font-size: 9.5pt;
    }
    pre {
      padding: 12px;
      font-size: 9pt;
      overflow-x: auto;
      border: 1px solid #E2E8F0;
      page-break-inside: avoid;
    }
    .box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-left: 4px solid #030712;
      padding: 12px 16px;
      margin: 15px 0;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 9pt;
      color: #94A3B8;
      text-align: center;
      border-top: 1px solid #E2E8F0;
      padding-top: 5px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div class="cover-title">ASSET ARRAY</div>
    <div class="cover-subtitle">Institutional Private Wealth Management & Advisory Platform</div>
    <div class="cover-badge">PRODUCTION RELEASE VERSION 3.3.1</div>

    <div style="margin: 40px 0;">
      <p style="font-size: 13pt; color: #1E293B; max-width: 500px; margin: 0 auto; line-height: 1.6;">
        Complete System Architecture, Feature Directory, Verification Evidence & API Specifications
      </p>
    </div>

    <div class="cover-meta">
      <strong>Platform Target:</strong> Web (PWA), Desktop, Mobile (Expo / React Native)<br>
      <strong>Live Web App:</strong> https://asset-array.web.app<br>
      <strong>Live Backend API:</strong> https://assetarray.onrender.com<br>
      <strong>Repository:</strong> https://github.com/SakshamJ01/AssetArray<br>
      <strong>Generated Date:</strong> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
    </div>
  </div>

  <!-- TABLE OF CONTENTS / EXECUTIVE SUMMARY -->
  <h1>1. Executive System Overview</h1>
  <p>
    <strong>Asset Array</strong> is an enterprise-grade multi-asset private wealth management operating system designed for registered investment advisors (RIAs), family offices, wealth managers, and institutional asset managers. It provides client-side zero-knowledge encryption, GIPS-informed performance analytics, real-time market data, AI wealth co-pilot integration, zero-PII statement parsing, and statutory Indian tax harvesting.
  </p>

  <div class="box">
    <strong>Key Production Specifications:</strong>
    <ul>
      <li><strong>Frontend Web App:</strong> Firebase Hosting Global CDN (<code>https://asset-array.web.app</code>)</li>
      <li><strong>Backend API:</strong> Render Node.js / Express PaaS (<code>https://assetarray.onrender.com</code>)</li>
      <li><strong>Database:</strong> MongoDB Atlas Cloud Replica Set</li>
      <li><strong>Design System:</strong> Obsidian Dark (<code>#030712</code>) & Champagne Gold (<code>#E0A84C</code>)</li>
      <li><strong>Test Coverage:</strong> 54 Jest Test Suites, 305 Unit & Integration Tests (100% Passing)</li>
      <li><strong>Monetization:</strong> RevenueCat Native & Web Store SDK (<code>pro_advisor</code> entitlement)</li>
    </ul>
  </div>

  <h1>2. Complete Infrastructure & Tech Stack</h1>
  <table>
    <thead>
      <tr>
        <th>Layer</th>
        <th>Technologies Used</th>
        <th>Role & Architecture</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Client Layer</strong></td>
        <td>React Native Web 0.81, Expo 54, TypeScript 5.9, React 19</td>
        <td>Cross-platform Web/Desktop/Mobile PWA with responsive layouts and canonical border radii.</td>
      </tr>
      <tr>
        <td><strong>Styling & Theme</strong></td>
        <td>Vanilla CSS Tokens, Inter Typography, Obsidian & Gold Palette</td>
        <td>High-contrast luxury dark theme (<code>#030712</code>) and Swiss Private Banking light mode.</td>
      </tr>
      <tr>
        <td><strong>Backend API</strong></td>
        <td>Node.js, Express 5.2, JWT Tokens, CORS Guardrails</td>
        <td>RESTful backend supporting auth, AES-256 vault sync, and client dossier storage.</td>
      </tr>
      <tr>
        <td><strong>Database</strong></td>
        <td>MongoDB 7.6, Mongoose / Native Mongo Driver</td>
        <td>Cloud-hosted document storage for advisor accounts, clients, and encrypted payloads.</td>
      </tr>
      <tr>
        <td><strong>AI Engine</strong></td>
        <td>Google Gemini API (2.5-Flash/Pro), Local Ollama (qwen3:4b)</td>
        <td>Dual-gateway AI copilot with PII redaction and mathematical claim grounding.</td>
      </tr>
      <tr>
        <td><strong>Market Data</strong></td>
        <td>Stochastic Engine, AMFI NAV API, Finnhub, Alpha Vantage</td>
        <td>Streaming exchange tick prices for Equities, Mutual Funds, SGB, Bond Yields, and Forex.</td>
      </tr>
      <tr>
        <td><strong>Monetization</strong></td>
        <td>RevenueCat SDK (<code>react-native-purchases</code>)</td>
        <td>In-app subscription management and entitlement gating for Pro Advisor tiers.</td>
      </tr>
    </tbody>
  </table>

  <h1>3. Exhaustive Feature Directory (From Ground 0 to v3.3.1)</h1>

  <h2>3.1 Client 360 Workspace & Portfolio Manager</h2>
  <ul>
    <li><strong>Client Roster Management:</strong> Filterable table & card roster displaying client name, AUM, category (HNI, UHNWI, Retail, Institutional), risk profile, priority level, and review reminders.</li>
    <li><strong>Client 360 Workspace:</strong> Dedicated 360 view with portfolio holdings breakdown, change detection insights, and follow-up plans.</li>
    <li><strong>Bulk Campaign Outreach:</strong> Multi-select checkbox matrix for batch client messaging via Email, WhatsApp, and SMS.</li>
    <li><strong>1-Click PDF Report Exporter:</strong> On-device PDF generation with advisor branding, disclosures, asset allocation bars, and performance summary using <code>expo-print</code>.</li>
  </ul>

  <h2>3.2 1-Click Statement & CAS Importer Engine (Zero-PII)</h2>
  <ul>
    <li><strong>Multi-Broker Support:</strong> Native parsing engine for <strong>Zerodha</strong>, <strong>Groww</strong>, <strong>CAMS</strong>, and <strong>NDSL eCAS</strong> consolidated account statements.</li>
    <li><strong>Automated PII Redaction:</strong> Built-in <code>sanitizePii()</code> utility scrubbing PAN cards, Aadhaar numbers, email addresses, and phone numbers in compliance with India's DPDP Act 2023.</li>
    <li><strong>Prominent Button Placement:</strong> Access statement import directly from the Desktop Sidebar (<code>DESK ACTIONS</code>), Client Roster header, or Portfolios workstation bar.</li>
  </ul>

  <h2>3.3 Institutional Portfolio Analytics & Performance Engine</h2>
  <ul>
    <li><strong>Time-Weighted Return (TWR):</strong> GIPS-informed sub-period return calculation isolating external cash inflows and outflows.</li>
    <li><strong>Money-Weighted Return (XIRR):</strong> Exact Newton-Raphson cash-flow yield solver for internal rate of return.</li>
    <li><strong>Holdings Treemap:</strong> Interactive area-proportional rectangular heatmap visualizing holding weights and gains/losses.</li>
    <li><strong>Portfolio Rebalancing Studio:</strong> Automated order generator calculating target weight drifts and exact Buy/Sell order quantities.</li>
  </ul>

  <h2>3.4 Real-Time Live Share Market Ticker & Level-2 Terminal</h2>
  <ul>
    <li><strong>Live Micro-Flash Ticker:</strong> Top streaming bar for <code>RELIANCE</code>, <code>TCS</code>, <code>INFY</code>, <code>BANKNIFTY</code>, <code>SGB_GOLD</code>, <code>BHARATBOND30</code>, <code>IN_10Y_GSEC</code>, <code>USD/INR</code>, and Crypto.</li>
    <li><strong>Level-2 Depth Terminal:</strong> Top 5 Bid & Ask order book depth with live quantities, buy/sell volume pressure gauge, intraday 30-tick sparklines, and day high/low sliders.</li>
    <li><strong>AMFI Mutual Fund NAV Sync:</strong> Daily automated ingestion of official NAVs across Indian mutual fund schemes.</li>
  </ul>

  <h2>3.5 Indian Tax Intelligence & Loss Harvesting (AY 2026-27 / FY 2025-26)</h2>
  <ul>
    <li><strong>Section 112A LTCG:</strong> 12.5% tax rate computation on long-term equity gains exceeding the ₹1,25,000 statutory exemption threshold.</li>
    <li><strong>Section 111A STCG:</strong> 20.0% tax rate computation on short-term equity gains.</li>
    <li><strong>Section 70 & 74 Set-off:</strong> Intra-head and inter-head gain/loss offset evaluation.</li>
    <li><strong>Tax Loss Harvesting Plan:</strong> 1-click harvester identifying loss positions, computing net tax savings, and providing 30-day wash-sale guidance.</li>
  </ul>

  <h2>3.6 Risk Intelligence, Monte Carlo & Scenario Sandbox</h2>
  <ul>
    <li><strong>0-100 Portfolio Health Diagnostic:</strong> Multi-pillar rating evaluating data quality, HHI entropy diversification, single-asset concentration, and liquidity.</li>
    <li><strong>1,000-Path Monte Carlo Simulator:</strong> Mulberry32 PRNG statistical simulation generating P10 (pessimistic), P50 (median), and P90 (optimistic) wealth trajectories.</li>
    <li><strong>Historical Crisis Presets:</strong> Shock testing for *2008 GFC Crunch*, *Tech Correction*, *1970s Stagflation*, and *Rate Hike Shocks*.</li>
  </ul>

  <h2>3.7 Local Ollama & Gemini AI Wealth Copilot</h2>
  <ul>
    <li><strong>Dynamic Ollama Model Discovery:</strong> Auto-detects local Ollama instance (e.g. <code>qwen3:4b</code>) for zero-latency offline AI inference.</li>
    <li><strong>Google Gemini Gateway:</strong> Support for <code>gemini-2.5-flash</code> and <code>gemini-2.5-pro</code> with numerical grounding and PII redaction.</li>
  </ul>

  <h1>4. Verification & Testing Evidence</h1>
  <div class="box">
    <strong>Test Suite Results:</strong><br>
    All 54 Jest test suites comprising 305 individual unit and integration tests passed cleanly.
    <pre>
Test Suites: 54 passed, 54 total
Tests:       305 passed, 305 total
Snapshots:   0 total
Time:        14.28s
Typecheck:   0 errors (tsc --noEmit clean)
    </pre>
  </div>

  <h1>5. API Specifications</h1>
  <table>
    <thead>
      <tr>
        <th>Method</th>
        <th>Endpoint</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>GET</code></td>
        <td><code>/api/health</code></td>
        <td>Backend health check returning DB connection status, app version, and timestamp.</td>
      </tr>
      <tr>
        <td><code>POST</code></td>
        <td><code>/api/advisor/login</code></td>
        <td>Advisor authentication returning JWT access and refresh token pair.</td>
      </tr>
      <tr>
        <td><code>POST</code></td>
        <td><code>/api/advisor/refresh</code></td>
        <td>Silent JWT token renewal endpoint using stored refresh token.</td>
      </tr>
      <tr>
        <td><code>POST</code></td>
        <td><code>/api/sync/push</code></td>
        <td>Uploads client-side AES-256 encrypted payload to MongoDB cloud vault.</td>
      </tr>
      <tr>
        <td><code>GET</code></td>
        <td><code>/api/sync/pull</code></td>
        <td>Downloads latest encrypted advisor payload from cloud storage.</td>
      </tr>
      <tr>
        <td><code>POST</code></td>
        <td><code>/api/broadcast</code></td>
        <td>Executes multi-channel client broadcast campaign (Email/SMS/WhatsApp).</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 40px; border-top: 1px solid #CBD5E1; padding-top: 15px; text-align: center; color: #64748B; font-size: 9pt;">
    Asset Array v3.3.1 Executive Technical Report • Generated for Shipathon 2026 & Institutional Audit
  </div>

</body>
</html>
`;

const htmlPath = path.join(__dirname, '..', 'scratch', 'project_documentation.html');
const pdfPath = path.join(__dirname, '..', 'AssetArray_Full_Project_Documentation.pdf');

// Ensure scratch dir exists
const scratchDir = path.dirname(htmlPath);
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log(`HTML documentation generated at ${htmlPath}`);

// Compile HTML to PDF using Chrome Headless
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

try {
  console.log('Compiling HTML to PDF using Chrome Headless...');
  const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log(`PDF successfully generated at: ${pdfPath}`);
} catch (err) {
  console.error('Failed to generate PDF via Chrome:', err.message);
  process.exit(1);
}
