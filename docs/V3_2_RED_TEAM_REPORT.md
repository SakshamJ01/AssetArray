# ASSETARRAY V3.2 — RED-TEAM INSTITUTIONAL AUDIT & PENETRATION REPORT
**Audit Codename:** BREAK-IT-BEFORE-YOU-SHIP  
**Target Release:** AssetArray v3.2.0  
**Baseline Commit:** `0d753e42e167acd029c756c3a3ccd6a048f4a281` (v3.1.0)  
**Lead Auditor:** Institutional Quantitative, Security & Financial Systems Red Team  
**Date:** September 2026  
**Status:** FORENSIC AUDIT COMPLETE — REMEDIATION IN PROGRESS  

---

## 1. Executive Summary & Audit Posture

AssetArray v3.1 successfully deployed an initial layer of institutional modules (TWR, XIRR, Brinson-Fachler attribution, statutory tax calculation, multi-pillar health scores, macro sandbox, and DPDP sanitization). 

However, subjecting the codebase to rigorous adversarial red-teaming across **Quant/Financial Mathematics**, **Cybersecurity & Access Control**, **Data Integrity & Provenance**, **Statutory Tax Compliance**, and **AI Determinism** reveals critical vulnerabilities, fabricated assumptions, numerical edge-case failures, and authorization holes that would fail serious institutional due diligence.

### High-Level Vulnerability Summary

| Risk Tier | Total Identified | Primary Affected Subsystems |
| :--- | :--- | :--- |
| 🔴 **CRITICAL** | 6 | Broken Object Level Authorization (IDOR) in Cloud Sync, Weak AES Key Derivation & PIN Brute-Force Vulnerability, Silent Inflow Assumption on Total Loss XIRR, Inferred Holding Period in Tax Harvesting, Double-Counting State Mutation in Net Worth, Backend Heuristic Duplication in Macro Sandbox |
| 🟠 **HIGH** | 7 | TWR Cash Flow Timing Disconnect & Missing Daily Subperiod Exclusivity, Zero Volatility Silent Fallback to 0/1 in Beta/Sharpe/Sortino, Attribution Silent 0.0 Category Fallback & Missing Provenance, Missing Aadhaar & Contextual Free-Text PII Scrubbing, Health Score Silent Manufacture of Country/Currency ("India"/"INR"), Unrecovered Drawdown Tracking Gap, Goal Engine Silent Rewriting of Past Target Dates |
| 🟡 **MEDIUM** | 5 | Smart Alert Reappearance on Tick Storms (Lack of Cooldown/Resolution State Machine), Single-Broker Multi-Account Suppression in Net Worth, Non-Seeded Randomness in What-If Stochastic Scatter, Floating-Point Intermediate Precision Accumulation, Missing Benchmark FX/Dividend Provenance Tracking |
| 🔵 **LOW / INFO**| 4 | UI Claims of "Guaranteed Tax Shield" / "Institutional Grade" Overclaiming, Missing Currency Mismatch Disclaimers in Cross-Border Portfolios, PWA Cache Stale Sync Race Conditions, PDF Header Disclosures Missing Quality Confidence Badges |

---

## 2. Phase 0: System Architecture & Boundaries

### 2.1 Front-End Architecture
- **Framework & Core:** React 19, React Native 0.81.5, Expo SDK 54, TypeScript 5.9.2.
- **Entrypoint:** `App.tsx` (3,117 lines) - handles top-level routing, root state, PIN/biometrics lock gate, modal dispatching, and responsive view layouts (Mobile TabBar vs. Desktop Sidebar).
- **Domain Boundaries:**
  - `src/services/performance/`: TWR, XIRR, daily return series generation.
  - `src/services/attribution.ts`: Brinson-Fachler active return decomposition.
  - `src/services/risk/`: High Water Mark drawdown, benchmark analytics (Beta, Alpha, Sharpe, Sortino, Up/Down capture).
  - `src/services/tax/`: Statutory capital gains calculator (Sec 111A/112A/70/74), tax-lot engine, loss harvesting optimizer.
  - `src/services/health/`: Multi-pillar modular score (Data Quality, Diversification, Concentration, Geographic, Liquidity, Liability, Goals).
  - `src/services/goals/`: Future-value inflation planner and Monte Carlo probability evaluator.
  - `src/services/scenarioEngine.ts`: Macro crisis shocks and portfolio comparison sandbox.
  - `src/services/ai/`: DPDP Act 2023 PII sanitization and structured JSON validator.
  - `src/services/netWorth.ts`: Consolidated multi-asset net worth and anti-double-counting engine.
  - `src/services/smartAlerts.ts`: Policy violation governance and automated surveillance.

### 2.2 API & Backend Architecture
- **Runtime:** Node.js Express (`backend/server.js`), MongoDB Atlas cloud replica.
- **Authentication:** JWT access tokens (15m TTL) + refresh tokens with database session revocation (`sessionsCol`). PBKDF2 password hashing (100,000 iterations, SHA-512).
- **Endpoints:**
  - `/api/auth/*`: Login, refresh, logout, me.
  - `/api/sync`: Encrypted JSON backup synchronization.
  - `/api/broadcast/*`: Multi-channel advisor broadcast campaigns.
  - `/api/ai/research`: Gemini 2.5 Flash market research synthesis.
  - `/api/portfolios/*`: Attribution, Health, Tax-Harvest, and What-If analytical endpoints.

### 2.3 Persistence, Security & Encryption
- **Client Storage:** `@react-native-async-storage/async-storage` wrapped via `src/platform/storage`.
- **Sync Encryption:** Client-side AES encryption using `crypto-js` with PIN-derived keys.
- **Biometrics:** `expo-local-authentication` wrapped via `src/platform/auth`.
- **Monetization:** `react-native-purchases` (RevenueCat) with Web/Native abstraction layer (`src/platform/billing`).

---

## 3. Financial Calculation Engines Inventory

| Engine | Implementation File | Mathematical Formula / Model | Primary Vulnerabilities / Audit Red Flags |
| :--- | :--- | :--- | :--- |
| **TWR** | `src/services/performance/twr.ts` | $\prod (1 + R_i)$, $R_i = \frac{V_{end} - CF_i}{V_{begin}} - 1$ | Assumes cash flows always occur at end of period. Zero/negative beginning NAV causes failure. No daily subperiod approximation label when cash flows are unlinked. |
| **XIRR / MWR** | `src/services/performance/xirr.ts` | $\sum \frac{CF_k}{(1 + r)^{t_k}} = 0$ (Newton-Raphson + Bisection) | Skips `endingValue === 0`, causing total-loss investments to fail with `INSUFFICIENT_DATA` rather than returning -100%. No unique-solution or post-convergence residual validation. |
| **Attribution** | `src/services/attribution.ts` | Brinson-Fachler: Allocation, Selection, Interaction | Missing benchmark returns silently fall back to `0.0`. Standard benchmarks use static unprovenanced numbers without currency, dividend treatment, or `SIMULATED` flags. |
| **Beta / Alpha** | `src/services/risk/benchmarkAnalytics.ts` | $\beta = \frac{Cov(R_p, R_b)}{Var(R_b)}$, $\alpha = R_p - [R_f + \beta(R_b - R_f)]$ | When benchmark variance is 0, silently manufactures `beta = 1.0`. When tracking error is 0, returns Information Ratio = 0 instead of `UNDEFINED`. |
| **Sharpe / Sortino** | `src/services/risk/benchmarkAnalytics.ts` | Sharpe: $\frac{R_p - R_f}{\sigma_p}$, Sortino: $\frac{R_p - R_f}{DD}$ | When portfolio volatility or downside deviation is 0, returns 0 instead of `UNDEFINED`. |
| **Drawdown** | `src/services/risk/drawdown.ts` | High Water Mark peak-to-trough series | Unrecovered drawdowns have `recoveryDate: null` but lack explicit `NOT_RECOVERED` status and total underwater duration days tracking. |
| **Monte Carlo** | `src/services/monteCarlo.ts` | Geometric Brownian Motion with Mulberry32 PRNG | Missing validation for $P_5 \le P_{25} \le P_{50} \le P_{75} \le P_{95}$ invariants under extreme shock inputs. |
| **Goal Planner** | `src/services/goals/goalEngine.ts` | Future Value of Annuity + Monte Carlo | Rewrites past target dates (`targetYear < currentYear`) to 1 year in future via `Math.max(1, diff)` instead of flagging as expired. |
| **Tax Calculator** | `src/services/tax/taxCalculator.ts` | Sec 111A/112A/70/74 Statutory Set-Off | Finance Act 2024 compliance is solid, but surcharge thresholds for HNIs (>₹50L) and cess application require formal metadata provenance. |
| **Tax Lots & Harvesting**| `src/services/tax/taxLots.ts`, `taxHarvesting.ts` | FIFO/Specific Lot Identification & Section 70/74 | `taxLots.ts` still parses "short" or "long" from notes. `taxHarvesting.ts` treats `isLongTerm === null` as Short-Term lot (20% shield) instead of `INSUFFICIENT_DATA`. |
| **Net Worth** | `src/services/netWorth.ts` | Assets - Liabilities with de-duplication | Mutates caller's `liabilities` array by `liabilities.push()`. Single-broker multi-account suppression wipes valid secondary accounts. |
| **Scenario Sandbox** | `src/services/scenarioEngine.ts` | Macro asset-class beta shock model | Generates volatility and drawdowns using arbitrary step functions (`curLargest > 0.35 ? 18.5 : 13.8`). Backend duplicates heuristic math. |
| **Smart Alerts** | `src/services/smartAlerts.ts` | Rule-based surveillance engine | Alerts are recreated as `OPEN` on every tick/evaluation even if previously acknowledged, resolved, or snoozed. |

---

## 4. In-Depth Red-Team Vulnerability Catalog

### VULN-01 (CRITICAL) — Broken Object Level Authorization (IDOR) on Cloud Sync Payload
- **Location:** `backend/server.js`:557-589 (`POST /api/sync`, `GET /api/sync/:ownerId`)
- **Vulnerability:** Any authenticated user with a valid JWT token can query `GET /api/sync/:ownerId` or overwrite `POST /api/sync` for ANY other user by supplying their `ownerId`. The backend does not verify that `req.user.id` or `req.user.username` matches `ownerId`.
- **Proof of Attack:**
  ```bash
  # User B logs in and gets token
  TOKEN_B=$(curl -s -X POST http://localhost:4000/api/auth/login -d '{"username":"advisor_b","password":"..."}' | jq -r .accessToken)
  # User B reads User A's encrypted sync blob:
  curl -H "Authorization: Bearer $TOKEN_B" http://localhost:4000/api/sync/owner_advisor_a
  # Returns User A's ciphertext!
  ```
- **Remediation:** Enforce server-side ownership. Restrict sync read/write so non-admin users can ONLY read and write their own `ownerId === req.user.id` or `ownerId === req.user.username`. Reject all cross-tenant access with 403 Forbidden.

### VULN-02 (CRITICAL) — Weak AES Key Derivation & PIN Brute-Force Vulnerability
- **Location:** `src/services/secureSync.ts`:146-163 (`buildOwnerId`, `encryptPayload`)
- **Vulnerability:**
  1. `buildOwnerId(pin)` is simply `CryptoJS.SHA256(pin).toString().slice(0, 24)`. If an advisor uses a 4-digit or 6-digit PIN, the entire keyspace ($10^6$) can be precomputed in a rainbow table or brute-forced in under 50 milliseconds.
  2. `CryptoJS.AES.encrypt(..., pin)` derives key/IV using OpenSSL `EVP_BytesToKey` (single iteration MD5/SHA1), not salted PBKDF2 or Argon2.
  3. No cryptographic integrity MAC (HMAC-SHA256) is appended.
- **Remediation:** Implement PBKDF2 key derivation with unique salt and minimum 100,000 iterations, or authenticate payloads using HMAC-SHA256. Clarify cryptographic claims from "military zero-knowledge" to "client-side PIN-encrypted sync backup".

### VULN-03 (CRITICAL) — XIRR Fails on Complete Loss (Ending Value = 0)
- **Location:** `src/services/performance/xirr.ts`:42-49
- **Vulnerability:** The check `if (endingValue > 0)` skips appending the terminal valuation when `endingValue === 0`. Consequently, an investor who invests ₹100,000 and experiences a 100% loss (endingValue = 0) gets an array with only 1 event, triggering `INSUFFICIENT_DATA` rather than correctly converging to -100% return.
- **Proof of Attack:**
  ```typescript
  calculateXIRR([{ date: "2025-01-01", amount: 100000 }], 0, "2026-01-01");
  // Returns { xirr: null, quality: "INSUFFICIENT_DATA" } instead of -1.0 (-100%)
  ```
- **Remediation:** Include ending value event whenever `endingValue >= 0` with proper terminal date. Handle total loss explicitly as -100% (-1.0) and verify that $NPV(rate) \approx 0$.

### VULN-04 (CRITICAL) — Tax Lots Default to Short-Term When Acquisition Date is Missing
- **Location:** `src/services/tax/taxHarvesting.ts`:40-41, 69-73
- **Vulnerability:**
  `const isLT = lot.isLongTerm === true;`  
  When `lot.isLongTerm === null` (acquisition date missing or unverified), `isLT` is `false`. The code then enters `if (!isLT && realizedGains.shortTerm > 0)`, classifying unverified lots as Short-Term and generating an immediate 20% tax shield!
- **Remediation:** Strictly check `isLongTerm === false` for short-term and `isLongTerm === true` for long-term. If `isLongTerm === null`, label lot as `DATE_MISSING / UNVERIFIED` with `estimatedTaxImpact = 0` and `confidence = "INSUFFICIENT_DATA"`.

### VULN-05 (CRITICAL) — Anti-Double-Counting In Net Worth Mutates Caller's Liabilities Array
- **Location:** `src/services/netWorth.ts`:129-135
- **Vulnerability:**
  When processing connected credit cards, the code directly mutates the passed-in argument: `liabilities.push({ ... })`. On every re-render or re-calculation, duplicate credit card entries are pushed into the caller's array, doubling reported liabilities and wiping out net worth!
- **Remediation:** Create an internal cloned array `const allLiabilities = [...liabilities]` before processing accounts.

### VULN-06 (CRITICAL) — Backend Analytical Endpoints Replicate Deprecated Heuristic Math
- **Location:** `backend/server.js`:940-950 (`/api/portfolios/whatif`)
- **Vulnerability:**
  The backend `/api/portfolios/whatif` endpoint still uses:
  `postShockSharpe = shock >= 0 ? 1.15 : Math.max(-0.5, parseFloat((0.85 + shock / 50).toFixed(2)));`  
  `goalSuccessProbability = Math.max(20, Math.min(99, Math.round(85 + shock * 0.8)));`  
  This directly contradicts the empirical portfolio calculations in the frontend.
- **Remediation:** Refactor backend endpoints to use deterministic holding-level formulas matching the institutional engine, or proxy/share the core calculation logic.

### VULN-07 (HIGH) — TWR End-of-Period Cash Flow Assumption Without Subperiod Valuation
- **Location:** `src/services/performance/twr.ts`:58-65
- **Vulnerability:**
  The subperiod formula $R_i = \frac{V_{end} - CF_i}{V_{begin}} - 1$ assumes that all cash flows occur exactly at the end of the subperiod. If a large deposit occurs right before a massive market swing and intra-period valuation is missing, the calculated return is distorted.
- **Remediation:** Explicitly flag the methodology as `TWR_METHOD: "DAILY_SUBPERIOD_APPROXIMATION"`. Add checks for beginning NAV $\le 0$ and emit explicit warnings when cash flows occur without same-day valuations.

### VULN-08 (HIGH) — Silent Manufacturing of 0/1 in Risk Metrics When Variance is Zero
- **Location:** `src/services/risk/benchmarkAnalytics.ts`:149-165
- **Vulnerability:**
  1. `beta = sampleVarB > 1e-12 ? sampleCov / sampleVarB : 1.0;` -> Silently manufactures $\beta = 1.0$ when benchmark is constant/zero volatility!
  2. `sharpeRatio = volP > 1e-8 ? ... : 0;` -> Returns Sharpe = 0 instead of `null` / `UNDEFINED` when portfolio volatility is zero!
  3. `sortinoRatio = downsideDev > 1e-8 ? ... : 0;` -> Returns Sortino = 0 instead of `null` / `UNDEFINED` when downside deviation is zero!
- **Remediation:** Return `null` with explicit `quality = "INSUFFICIENT_DATA" | "UNDEFINED"` and descriptive warnings rather than deceptive numeric zeros.

### VULN-09 (HIGH) — Attribution Benchmark Category Returns Silently Default to 0.0
- **Location:** `src/services/attribution.ts`:227-229
- **Vulnerability:** If a benchmark category return is missing, the code logs a warning and uses `Rb = 0.0`. This artificially inflates or deflates active alpha and distorts the Brinson-Fachler identity. Furthermore, `STANDARD_BENCHMARKS` lacks provenance (`asOf`, `currency`, `returnType`, `isSimulated`).
- **Remediation:** Add benchmark provenance metadata (`currency`, `frequency`, `returnType: "TOTAL_RETURN" | "PRICE_RETURN"`, `isSimulated`). Degrade calculation quality to `INSUFFICIENT_DATA` if a required category benchmark return is missing.

### VULN-10 (HIGH) — PII Sanitizer Contextual Leakage & Missing Aadhaar
- **Location:** `src/services/ai/aiSanitizer.ts`:56, 75-86
- **Vulnerability:**
  1. Line 56: `country: h.country || "India"`, `currency: h.currency || "INR"` silently manufactures geographical facts.
  2. 12-digit Indian Aadhaar numbers (`\b\d{4}\s?\d{4}\s?\d{4}\b`) are not masked.
  3. Contextual client notes (e.g., "Rajesh Sharma, Director at Infosys, account in HDFC") pass into AI research prompts without entity redaction.
- **Remediation:** Replace fallback "India"/"INR" with "UNKNOWN". Add regex scrubbing for Aadhaar and Indian IFSC/bank account formats. Scrub client names and common city names from context.

### VULN-11 (HIGH) — Health Score Geographic & Currency Fallback Silently Assumes India/INR
- **Location:** `src/services/health/factors/geographicAndCurrency.ts`:56-59
- **Vulnerability:** Missing country and currency metadata defaults to `countries.add("India")` and `currencies.add("INR")`. Missing data increases false confidence rather than lowering data quality.
- **Remediation:** Track explicit metadata provenance. If country/currency is absent, mark as `UNKNOWN`, penalize data quality confidence, and require advisor verification.

### VULN-12 (HIGH) — Goal Engine Silently Rewrites Past Target Dates
- **Location:** `src/services/goals/goalEngine.ts`:39-40
- **Vulnerability:** `yearsRemaining = Math.max(1, targetYear - currentYear)`. If `targetYear` is 2020 and `currentYear` is 2026, it sets `yearsRemaining = 1` and calculates future value for an expired goal.
- **Remediation:** If `targetYear <= currentYear`, mark goal as `EXPIRED / DUE` with `yearsRemaining = 0` and emit immediate audit warning.

---

## 5. Remediation Plan for AssetArray V3.2

1. **Fix All P0 Critical Vulnerabilities:**
   - Patch `backend/server.js` BOLA/IDOR vulnerability: enforce server-side user ownership on `/api/sync` and `/api/broadcast`.
   - Upgrade sync encryption documentation and PIN derivation safeguards.
   - Patch `xirr.ts` total-loss zero ending value bug, add residual verification ($NPV(rate) \approx 0$).
   - Patch `taxLots.ts` and `taxHarvesting.ts` to require explicit dates in institutional mode and reject synthetic holding periods.
   - Patch `netWorth.ts` array mutation bug and improve multi-account deduplication.
   - Replace backend heuristic math in `/api/portfolios/whatif` with empirical portfolio characteristics.

2. **Fix All P1 High Vulnerabilities:**
   - Remove silent 0/1 fallbacks in `benchmarkAnalytics.ts`; return `null` / `UNDEFINED` for zero volatility / undefined metrics.
   - Add benchmark abstraction with full provenance (`currency`, `returnType`, `isSimulated`) in `attribution.ts`.
   - Upgrade `aiSanitizer.ts`: mask Aadhaar, IFSC, bank accounts, and contextual entities; eliminate silent "India"/"INR" defaults.
   - Enforce explicit `UNKNOWN` and confidence penalties in `health/factors/geographicAndCurrency.ts`.
   - Fix `goalEngine.ts` past-date handling.
   - Add alert cooldown, acknowledgement, snooze, and resolve lifecycle state machine in `smartAlerts.ts`.

3. **Build Comprehensive Adversarial Test Suite:**
   - Create `__tests__/redteam.adversarial.test.ts` testing all known attack scenarios (TWR, XIRR, Attribution, Risk, Drawdown, Tax, Goals, Health, Net Worth, AI, Security).
   - Create property-based tests verifying mathematical invariants ($P_5 \le P_{50} \le P_{95}$, $\sum w_i = 1$, $Assets - Liabilities = Net Worth$, Active Return = Alloc + Select + Interact).

4. **Verify Quality & Zero Regressions:**
   - All 23 original test suites + all new adversarial test suites must pass 100%.
   - `npm run typecheck` must pass with zero TypeScript errors.
   - Production web build (`npm run build:web`) must pass.
