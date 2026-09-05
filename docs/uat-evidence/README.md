# AssetArray — True Browser E2E Evidence Dossier

**Release Family:** 3.3.x  
**Live Production URL:** [https://asset-array.web.app](https://asset-array.web.app)  
**Live Backend Microservice:** [https://assetarray.onrender.com/api/health](https://assetarray.onrender.com/api/health)  
**Execution Environment:** Native Google Chrome Headless v152.0.7977.82 (`playwright-core`)  

---

## 1. Overview of Evidence Files

| File | Purpose & Verification Scope |
| :--- | :--- |
| [`e2e-evidence.json`](file:///c:/Users/Saksham/Documents/New%20project/docs/uat-evidence/e2e-evidence.json) | Complete execution log of Level-1 true browser user interactions in native Google Chrome against production, including HTTP request traces, console messages, durations, and statuses. |
| [`workflow-results.json`](file:///c:/Users/Saksham/Documents/New%20project/docs/uat-evidence/workflow-results.json) | Granular checklist of all 11 audited Golden Workflows with timestamps, evidence citations, and verified statuses. |
| [`performance-results.json`](file:///c:/Users/Saksham/Documents/New%20project/docs/uat-evidence/performance-results.json) | High-resolution performance benchmarks measured with `performance.now()` across calculation engines and network queries. |
| [`runtime-results.json`](file:///c:/Users/Saksham/Documents/New%20project/docs/uat-evidence/runtime-results.json) | Runtime environment metadata, Node version, test suite counts, and final production readiness classification. |
| [`screenshots/`](file:///c:/Users/Saksham/Documents/New%20project/docs/uat-evidence/screenshots/) | 13 high-resolution visual PNG screenshots captured during real browser sessions across Desktop (1440px), Tablet (1024px), and Mobile (390px). |

---

## 2. Screenshot Manifest & Visual Evidence

1. `00-home.png`: Initial boot and private vault PIN setup screen on production.
2. `01-login.png`: Vault PIN entry and authentication.
3. `02-dashboard.png`: Unlocked advisor dashboard with total tracked AUM and key KPI widgets.
4. `04-clients-tab.png`: Advisor client roster with category filters (HNI, Retail, Ultra HNI).
5. `04-client-created.png`: Client creation modal and successful entry of deterministic `E2E_TEST Priya Sharma`.
6. `04-client-after-reload.png`: Client persistence in roster after full browser reload.
7. `05-client-360.png`: Client 360 Workspace loaded in <1.1s with portfolio breakdown, goals, and health index.
8. `06-portfolio.png`: Portfolio manager with asset class allocation bars and holdings table.
9. `10-risk-analytics.png`: Tools suite with tax-loss harvesting, risk VaR calculations, and Monte Carlo goal projection.
10. `16-ai-research.png`: AI research screen with verified citation cards and conflict detection.
11. `18-command-center.png`: Advisor Command Center with priority lanes: *Critical Today*, *Opportunities*, and *Upcoming*.
12. `19-desktop-1440.png`: Full 1440 × 900 desktop workstation layout with high financial density.
13. `20-tablet-1024.png`: 1024 × 768 tablet responsive layout with adaptive sidebars.
14. `21-mobile-390.png`: 390 × 844 mobile layout verified with zero horizontal overflow.

---

## 3. Real AMFI Mutual Fund NAV Feed Evidence

Direct HTTP GET verification against the official open AMFI endpoint:
- **Endpoint:** `https://www.amfiindia.com/spages/NAVAll.txt`
- **HTTP Status:** `200 OK`
- **Total Ingested Schemes:** `18,022`
- **Sample Verified Scheme:** `Scheme 135762` (*Axis Children's Fund - Direct Plan - Growth Option*)
- **Parsed Daily NAV:** `₹30.3228`
- **As-of Date:** `04-Sep-2026`

---

## 4. Production Backend Microservice Evidence

Direct health API probe against the live Render backend:
- **Endpoint:** `https://assetarray.onrender.com/api/health`
- **HTTP Status:** `200 OK`
- **Payload:**
  ```json
  {
    "status": "ok",
    "app": "Asset Array backend",
    "version": "3.3.1",
    "authRequired": true,
    "db": "connected"
  }
  ```

---

## 5. Final Classification

**Classification:** `READY WITH LIMITATIONS`  
- **Verified Strengths:** Zero client API secrets, real AMFI mutual fund prices, statutory AY 2026-27 Indian tax engine, 100% test suite pass rate (47/47 suites, 253 tests), fast client loading (<1.1s).  
- **Operational Boundaries:** AMFI NAVs update once daily on EOD schedule (~9:00 PM IST); Free AI tier adheres to 15 RPM Gemini limits with local Ollama fallback.
