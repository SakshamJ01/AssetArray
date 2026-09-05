# ASSETARRAY V3.1 — COMPREHENSIVE ARCHITECTURAL & FINANCIAL AUDIT
**Document Version:** 3.1.0-AUDIT  
**Date:** September 2026  
**Auditor:** Institutional Quantitative & Platform Engineering Team  
**Scope:** Complete Codebase Audit (`App.tsx`, `src/services/`, `src/components/`, `src/types/`, `backend/`, and verification tests)

---

## 1. Executive Summary

AssetArray v3.0 successfully introduced institutional-facing modules: Brinson-Fachler performance attribution, a 0–100 multi-pillar health score, Indian tax harvesting intelligence, macro scenario stress testing, smart fiduciary alerts, and AI investment committee memo generation.

However, a rigorous line-by-line audit of the calculation engines reveals that several components rely on **synthetic heuristics, unlinked cumulative returns, hardcoded arbitrary fallback parameters, and non-statutory tax rules**. In particular:
1. **Holding periods in Tax Intelligence were determined by array index parity (`index % 2 === 0`) or checking notes for `"LT"`**, rather than actual transaction or tax lot acquisition dates.
2. **Loss harvesting aggregated capital losses and offset short-term capital gains first**, in violation of Section 70/74 of the Indian Income Tax Act (where Long-Term Capital Losses cannot offset Short-Term Capital Gains).
3. **Performance attribution derived category returns via simple unlinked cumulative growth `(currentValue - investedValue) / investedValue`**, completely ignoring external cash flows (deposits, withdrawals, dividends) and sub-period linking (Time-Weighted Returns).
4. **Missing benchmark returns fell back to arbitrary magic numbers (`|| 0.08 || 0.07`)** rather than transitioning to an explicit `INSUFFICIENT_DATA` state.
5. **Macro scenario stress testing generated Sharpe ratios, volatility, and goal probabilities via static ad-hoc multipliers (`Math.round(85 + percentChange * 0.8)`)** rather than empirical portfolio characteristics.
6. **Backend endpoints in `backend/server.js` duplicated client-side heuristic logic** without proper validation or unified engine sourcing.

AssetArray v3.1 systematically hardens the platform to institutional grade: preserving all working workflows, eliminating fabricated assumptions, introducing formal data provenance (`dataSource: "LIVE_MARKET" | "HISTORICAL" | "USER_INPUT" | "IMPORTED" | "SIMULATED" | "ESTIMATED"`), and structuring calculations into modular, deterministic, testable packages.

---

## 2. Current Architecture & Component Map

### 2.1 Front-End Layer (React Native / Expo / Web)
- **Framework:** React 19, React Native 0.81.5, Expo SDK 54, TypeScript 5.9.2.
- **Entrypoint:** `App.tsx` (3,117 lines). Manages root state, PIN/biometric authentication, navigation between 6 primary tabs (`DashboardScreen`, `ClientsScreen`, `PortfoliosScreen`, `ToolsScreen`, `WorkspaceScreen`, `SettingsScreen`, `AiResearchScreen`), and modal mounting.
- **Styling:** Custom Obsidian & Champagne Gold private-bank design system (`src/theme/appStyles.ts`), responsive across Desktop Web (Sidebar), Tablet, and Mobile (Bottom Bar).
- **Persistence:** `@react-native-async-storage/async-storage` via platform abstraction (`src/platform/storage/`).
- **Billing:** Cross-platform RevenueCat abstraction (`src/platform/billing/`).
- **Reporting:** Client-side HTML/CSS print-to-PDF engine (`src/services/pdfReport.ts`).

### 2.2 Back-End Layer (Node.js / Express / MongoDB)
- **Framework:** Node.js, Express, MongoDB Node Driver 6.x. Single-file server (`backend/server.js`, 940 lines).
- **Authentication:** JWT access tokens (15m TTL) + refresh tokens (30d TTL) stored in `refresh_sessions` collection. PBKDF2 password hashing (100k iterations, SHA-512).
- **Rate Limiting & Security:** In-memory sliding bucket rate limiter (120 req/min), timing-safe equal checks, security headers (`nosniff`, `DENY`, `no-store`).
- **Data Persistence:**
  - `users`: Advisor credentials and roles.
  - `refresh_sessions`: Active and revoked refresh token sessions.
  - `encrypted_sync_blobs`: Client-side encrypted JSON payloads (`ownerId`, `ciphertext`, `updatedAt`).
  - `broadcast_campaigns`: Advisor multi-channel broadcast records.
  - `audit_logs`: Fiduciary action audit trail.
  - `ai_research_history`: Cached research interactions.
- **External AI Integration:** `@google/genai` (Gemini 2.5 Flash) for institutional market research queries.

---

## 3. Detailed Audit of Analytical Engines & Flaws

| Subsystem | File & Lines | Current Logic / Flaw | Institutional Standard Required | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **Tax Intelligence** | `src/services/taxIntelligence.ts`:38-42 | `const isLongTerm = (h.notes \|\| "").toLowerCase().includes("lt") \|\| index % 2 === 0; const holdingMonths = isLongTerm ? 18 : 6;` | Holding periods MUST derive from explicit `TaxLot` with `acquiredAt` and disposal/as-of dates. If dates missing, emit `INSUFFICIENT_TAX_LOT_DATA`. | **CRITICAL** |
| **Tax Intelligence** | `backend/server.js`:828 | `const rate = idx % 2 === 0 ? 12.5 : 20.0;` | Backend replicates array-index tax rate assignment. | **CRITICAL** |
| **Tax Intelligence** | `src/services/taxIntelligence.ts`:86 | `washSaleWarning: isLoss` | Labels all unrealized losses as wash sales; India has no US IRC §1091 wash-sale statute. Must frame as GAAR / fiduciary rebuy advisory. | **HIGH** |
| **Tax Intelligence** | `src/services/taxIntelligence.ts`:94-106 | `effectiveRealizedST = Math.max(0, realizedGains.shortTerm - totalHarvestableLoss)` | Indian Income Tax Act (Sec 70/74) forbids setting off LTCL against STCG. LTCL can only set off LTCG. STCL can set off both STCG and LTCG. | **CRITICAL** |
| **Attribution** | `src/services/attribution.ts`:102 | `const rp = cInv > 0 ? (cVal - cInv) / cInv : (Rb \|\| 0.08);` | Derives return from naive cumulative `(cur - inv)/inv`. Fails when deposits/withdrawals occur. Falls back to magic 8% return. | **CRITICAL** |
| **Attribution** | `src/services/attribution.ts`:101, 137 | `const Rb = (benchmark.returns && benchmark.returns[cat]) \|\| 0.07;` | Benchmark category return falls back to hardcoded `0.07`. | **HIGH** |
| **Health Score** | `src/services/healthScore.ts`:108-112 | `if (ticker.includes("US") \|\| ticker.includes(".O") ...) geoCurScore += 10;` | Uses ticker string substring matching rather than formal asset taxonomy (`country`, `currency`, `assetClass`). | **HIGH** |
| **Health Score** | `src/services/healthScore.ts`:138 | `liabilityScore = liabilitiesValue > totalVal * 0.3 ? 60 : 90;` | Arbitrary step-function score without continuous debt-service or asset-coverage modeling. | **MEDIUM** |
| **Scenario Engine** | `src/services/scenarioEngine.ts`:104-128 | `impliedVol = Math.abs(percentChange) > 15 ? 22.5 : 14.8; goalSuccessProbability = Math.round(85 + percentChange * 0.8);` | Synthetic heuristic formulas. Does not calculate true post-shock distribution or factor in client goals. | **HIGH** |
| **Monte Carlo** | `src/services/monteCarlo.ts`:43-49 | `while (u1 === 0) u1 = Math.random();` | Uses non-seeded `Math.random()`. Runs are non-reproducible. Missing P5 and P95 percentile outputs. | **MEDIUM** |
| **Smart Alerts** | `src/services/smartAlerts.ts`:60-135 | Evaluates only 3 rules. Missing allocation drift, drawdown, goal deterioration, stale data, and duplicate suppression. | Must adhere to 4 severity tiers (`INFO`, `NOTICE`, `WARNING`, `CRITICAL`), suppression windows, and state tracking. | **MEDIUM** |
| **AI Layer** | `src/services/committeeMemo.ts`:69 | LLM prompt contains raw metrics without source attribution mapping. | Requires deterministic source mapping: `{ statement, sourceMetric, value }` to eliminate hallucination risk. | **HIGH** |

---

## 4. Required Fixes & Phased Technical Roadmap

### Phase 2: Data Model Foundation (`src/types/`)
- Introduce explicit types:
  - `DataProvenance`: `dataSource: "LIVE_MARKET" | "HISTORICAL" | "USER_INPUT" | "IMPORTED" | "SIMULATED" | "ESTIMATED"`.
  - `DataQuality`: `{ completeness: number, freshnessMinutes: number, source: string, confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA", warnings: string[] }`.
  - `TaxLot`: `{ id, securityId, ticker, assetClass, quantity, acquiredAt, costBasis, remainingQuantity, acquisitionSource }`.
  - `Transaction`: `{ id, portfolioId, holdingId, type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL" | "DIVIDEND" | "FEE", date, amount, quantity, price }`.
  - `HistoricalValuationPoint`: `{ date: string, nav: number, cashFlow?: number }`.
  - `Benchmark`: `{ id, symbol, name, currency, region, assetClass, methodology, dataSource, totalReturnAvailable, priceReturnAvailable, historicalReturns?: { date: string, returnRate: number }[] }`.
  - `MethodologyVersion`: string on all analytical outputs.

### Phase 3: Performance & Brinson-Fachler Engine
- Create `src/services/performance/`:
  - `twr.ts`: Time-Weighted Return with sub-period linking around external cash flows.
  - `mwr.ts`: Money-Weighted Return (XIRR / Newton-Raphson solver).
  - `dailyReturns.ts`: Normalized daily return series generator.
  - `PerformanceQuality`: `"HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA"`.
- Refactor `src/services/attribution.ts`:
  - Enforce mathematical identity: `Active Return = Allocation + Selection + Interaction`.
  - Eliminate fallback magic numbers (`|| 0.08`). Return explicit `INSUFFICIENT_DATA` if benchmark returns are missing.

### Phase 4: Benchmark & Risk Engine
- Create `src/services/risk/`:
  - `benchmarkAnalytics.ts`: Active Return, Alpha, Beta, Tracking Error, Information Ratio, Sharpe Ratio, Sortino Ratio, Up/Down Capture.
  - `drawdown.ts`: Peak NAV, Trough NAV, Max Drawdown, Drawdown Duration, Recovery Date, Recovery Duration.

### Phase 5: Modular Explainable Health Score
- Create `src/services/health/`:
  - Factor modules: `dataQuality.ts`, `assetDiversification.ts`, `concentration.ts`, `geographicExposure.ts`, `currencyExposure.ts`, `liquidity.ts`, `liability.ts`, `goalAlignment.ts`.
  - Each factor returns: `{ score, weight, inputs, explanation, confidence, recommendations, evidence }`.

### Phase 6: Tax Engine Grounding (Indian Tax Law)
- Create `src/services/tax/`:
  - `taxLots.ts`: Tax lot manager with FIFO / Specific identification.
  - `taxRules.ts`: Configuration-driven ruleset for Indian Income Tax Act (Finance Act 2024 / AY 2026-27):
    - STCG on equity (Sec 111A): 20%.
    - LTCG on equity (Sec 112A): 12.5% above ₹1,25,000 exemption.
    - Holding period threshold: 12 months for listed equity/units; 24 months for unlisted; 36 months for debt/other assets acquired prior to April 2023.
    - Statutory set-off hierarchy: LTCL offsets only LTCG; STCL offsets both STCG and LTCG.
  - `taxCalculator.ts` and `taxHarvesting.ts`: Lot-aware loss harvesting with offset category allocation.
  - Disclaimer and fiduciary guidance (distinguish statutory laws vs general rebuy prudential advice).

### Phase 7: Goals & Reproducible Monte Carlo
- First-class `Goal` domain entity linking portfolio assets to target liabilities.
- Seeded pseudo-random number generator (Mulberry32 or Xorshift128) in Monte Carlo simulation for 100% reproducible advisory projections.
- Expose P5, P10, P25, P50, P75, P90, P95 percentiles.

### Phase 8: What-If Portfolio Sandbox
- Pure immutable scenario cloning: `basePortfolioId` -> `Scenario`.
- Side-by-side comparison of return, vol, Sharpe, drawdown, concentration, health score, tax impact.
- Absolute prevention of scenario mutations leaking into production holdings.

### Phase 9: Net Worth Engine & Advisor CRM
- Unified net worth calculation preventing double-counting of underlying assets in accounts.
- Task lifecycle management for Advisor Desk (`OPEN`, `IN_PROGRESS`, `WAITING`, `DONE`, `CANCELLED`).

### Phase 10: Smart Alerts Governance
- Alert schema: `{ id, createdAt, ruleId, clientId, portfolioId, severity: "INFO" | "NOTICE" | "WARNING" | "CRITICAL", metric, observedValue, threshold, message, status }`.
- Duplicate suppression within configurable time windows.

### Phase 11: AI Safety & Structured Grounding
- Strict pipeline: `DATABASE -> DETERMINISTIC ANALYTICS -> SANITIZED CONTEXT -> LLM -> STRUCTURED JSON VALIDATION -> UI`.
- Client PII scrubbing (`sanitizeForAI()`).
- Source metric citations for every numerical assertion in Committee Memos.

### Phase 12 & 13: PDF Reporting, UI Polish, and Rigorous QA
- Integrate all new analytics into multi-page PDF generation.
- Complete unit, property, and reconciliation test suites.
- TypeScript validation (`tsc --noEmit`) and Expo web production bundle compilation.

---

## 5. Migration & Backward Compatibility Strategy

1. **Zero Breaking Changes for Existing Portfolios:** Existing client records without granular transaction history will gracefully receive `PerformanceQuality = "INSUFFICIENT_DATA"` or `"ESTIMATED"`, preserving UI usability while accurately signaling data limitations.
2. **Dual-Layer Architecture:** Analytical engines remain pure TypeScript services in `src/services/` that run both client-side (for offline instant evaluation) and server-side (for automated background jobs and API consumers).
3. **Feature Flags:** Major new modules are gated by feature flags (`analytics.attribution`, `analytics.health`, `analytics.tax`, `analytics.scenarios`) allowing staged deployment and seamless regression fallback.
