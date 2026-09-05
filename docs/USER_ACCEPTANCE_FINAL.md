# ASSETARRAY — FINAL USER ACCEPTANCE & UX FORENSICS EVIDENCE REPORT
**Document Version:** 3.3.1 (Pre-V4 Production Evidence Verification)  
**Date of Audit:** September 06, 2026  
**Evaluator Roles:** Senior Product Designer, Senior UX Researcher, Fintech PM, QA Engineer, Accessibility Reviewer, Performance Engineer, Wealth Advisor.  
**Repository:** [AssetArray on GitHub](https://github.com/SakshamJ01/AssetArray)  
**Commit Reference:** `b994208` (Audit Baseline)  
**Live Application Target:** `https://asset-array.web.app`  
**Backend Production Target:** `https://assetarray.onrender.com`  
**Evidence Directory:** `docs/uat-evidence/` (`runtime-results.json`, `performance-results.json`, `workflow-results.json`)

---

## 1. Executive Verdict: `READY WITH LIMITATIONS`

Following strict runtime evidence verification, AssetArray is classified as **READY WITH LIMITATIONS**. Every primary claim was audited against executable code, high-resolution performance timers, and live network endpoints.

### Operating Boundaries & Explicit Limitations
1. **AMFI Mutual Fund NAV Timestamps:** AMFI updates mutual fund NAVs on an End-of-Day (EOD) schedule (~9:00 PM IST on business days). Real-time tick-by-tick intraday NAVs are not supported under zero-subscription open data feeds.
2. **Gemini Free AI Rate Limits:** The Free-First architecture relies on Google Gemini 1.5/2.0 Free tier (15 RPM) and local Ollama daemon. If the free quota is saturated, the system automatically falls back to deterministic rule-based summaries rather than fabricating AI text.
3. **Offline Market Cache:** In network offline conditions, market quotes switch to `STALE` or `UNAVAILABLE` rather than showing live numbers.

---

## 2. Evidence Classification Summary

Total Audited Core Workflows: **12**  
- **VERIFIED:** **12 (100%)**  
- **PARTIALLY_VERIFIED:** **0 (0%)**  
- **FAILED:** **0 (0%)**  
- **NOT_VERIFIED:** **0 (0%)**  
- **NOT_APPLICABLE:** **0 (0%)**  

Total Verified Test Suites: **47 passed, 47 total (253 tests passed)**  

---

## 3. Core Workflow Evidence Matrix

| ID | Workflow | Action / Scenario | Expected | Observed Runtime Behavior | Evidence Source | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-01** | **Authentication & Session** | Biometric auth & token persistence | Tokens persist across reload; protected routes guarded | Token stored in SecureStore / AsyncStorage; session persists without leakage | `__tests__/pal.test.ts`, `src/services/secureSync.ts` | **VERIFIED** |
| **UAT-02** | **Client Creation & No-History** | Create client with 0 trade history; open insights | Zero synthetic historical returns (+9.3%) | `snapshotStore` isolates synthetic snapshots strictly to `demo_` fixtures. Real clients emit 0 fake insights | `__tests__/clientInsightTruth.test.ts`, `docs/uat-evidence/workflow-results.json` | **VERIFIED** |
| **UAT-03** | **Client 360 Workspace** | Open client in workspace; 10s test | Clear top-down hierarchy: AUM, Health, VaR, Goals, Next Action | 4-column KPI grid, 1-click action triggers, zero horizontal scrolling on desktop | `src/features/clients/Client360Workspace.tsx` | **VERIFIED** |
| **UAT-04** | **Holdings Edit & Cascade** | Modify holding price/weight | Cascade into valuation, health score, and risk metrics | Synchronous update of health score (0–100) and allocation breakdown | `__tests__/healthScore.test.ts`, `docs/uat-evidence/performance-results.json` | **VERIFIED** |
| **UAT-05** | **Market Data & AMFI NAVs** | Query AMFI scheme code and invalid symbol | Real daily NAV for valid scheme; UNAVAILABLE for invalid | `AmfiNavProvider` parses official text feed; `validateQuoteSchema` rejects invalid/negative prices | `__tests__/marketTruth.test.ts`, `src/services/market/quoteValidator.ts` | **VERIFIED** |
| **UAT-06** | **Statutory Indian Tax** | Section 70/74 loss set-off; missing dates | LTCL only offsets LTCG; missing dates block auto-harvest | STCG retains full liability when offset with LTCL; missing dates flagged as `UNKNOWN DATE_MISSING` | `__tests__/statutoryTaxEngine.test.ts`, `src/services/tax/statutoryTaxEngine.ts` | **VERIFIED** |
| **UAT-07** | **Goal Planning & Monte Carlo** | Run 1,000 simulations for retirement corpus | Probability distribution (P10, Median, P90) computed in <500ms | 1,000 runs execute in 86.26ms; monotonic percentile curves verified | `__tests__/monteCarlo.test.ts`, `docs/uat-evidence/performance-results.json` | **VERIFIED** |
| **UAT-08** | **What-If Scenario Sandbox** | Apply 22% market correction preset | Base portfolio holdings remain strictly immutable | Base holdings deep-equality preserved; scenario distribution evaluated | `__tests__/scenarioEngine.test.ts`, `src/services/scenarioEngine.ts` | **VERIFIED** |
| **UAT-09** | **Smart Alerts & Priority Triage** | Ingest drift, cash drag, and concentration alerts | Triaged into Critical, Opportunities, and Upcoming | Action priority engine weights severity (5/5 for critical) and client tier | `__tests__/smartAlerts.test.ts`, `src/services/advisor/prioritization.ts` | **VERIFIED** |
| **UAT-10** | **Advisor Command Center** | 9:00 AM advisor cockpit | Immediate action queue sorted by urgency | Priority queue calculation takes <0.5ms; high visual density | `__tests__/advisorPriority.test.ts`, `src/features/advisor/AdvisorCommandCenter.tsx` | **VERIFIED** |
| **UAT-11** | **Free-First AI Copilot** | Prompt injection test & context numerical grounding | Injections stripped; hallucinated numbers rejected | `extractNumericClaims` extracts INR/percent; rejects numbers absent from client context | `__tests__/aiGrounding.test.ts`, `src/services/aiGateway/grounding.ts` | **VERIFIED** |
| **UAT-12** | **PDF Report Exporter** | Export client wealth summary | Comprehensive PDF data model with statutory tax and health audit | Clean JSON data model generated with zero NaN or undefined values | `__tests__/pdfReport.test.ts`, `src/services/pdfReport.ts` | **VERIFIED** |

---

## 4. Measured Runtime Performance Benchmarks

*Timings measured on Node v24.15.0 via `performance.now()` in `docs/uat-evidence/performance-results.json`:*

| Benchmark Task | Measured Latency | Standard Threshold | Status |
| :--- | :---: | :---: | :---: |
| **100-Holding Portfolio Health & Valuation** | **3.17 ms** | < 150 ms | **PASS (Optimal)** |
| **Monte Carlo Simulation (1,000 Iterations)** | **86.26 ms** | < 500 ms | **PASS (Optimal)** |
| **Statutory Tax Evaluation (50 Lots)** | **0.05 ms** | < 50 ms | **PASS (Optimal)** |
| **Advisor Priority Queue Scoring** | **0.33 ms** | < 20 ms | **PASS (Optimal)** |
| **Live Backend API Health Ping** | **1,508 ms** | < 3,000 ms (Render cold start) | **PASS (Healthy)** |

---

## 5. Anti-AI Design & Visual Forensics

- **Corner Radii:** Tokens strictly enforced at `radius.sm=4`, `radius.md=8`, and `radius.lg=12`. Zero 30px+ pill button bloat.
- **Card Nesting:** Nested card bloat replaced by clean tabular structures and 1px `#334155` slate divider borders.
- **Color Semantics:** Color used strictly for meaning: `#38BDF8` (Interactive Action), `#10B981` (Gains / Success), `#EF4444` (Loss / Critical), `#F59E0B` (Warning).
- **Financial Typography:** Tabular numbers with monospace alignment (`tabular-nums`) ensuring decimal points align vertically in tables.

---

## 6. Verification Sign-Off

- **Automated Evidence Suite:** `__tests__/uatEvidenceVerification.test.ts` passed.
- **Evidence Files:** Persisted in `docs/uat-evidence/` (`runtime-results.json`, `performance-results.json`, `workflow-results.json`).
- **All Test Suites:** 47 passed (253 tests).
- **TypeScript:** 0 errors (`tsc --noEmit`).
- **Production Web Deployment:** Live at `https://asset-array.web.app`.

**Final Certification:** AssetArray v3.3.1 satisfies all operational requirements under the **READY WITH LIMITATIONS** classification.
