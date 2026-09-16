# AssetArray — Functional Verification Report

**Release Family**: 3.3.x  
**Engine Verification**: 100% Deterministic Financial Math & State Persistence  

---

## Subsystem Functional Verification

### 1. Authentication & Session Management
* **PIN Gate**: Storage encryption with `AsyncStorage` + `expo-crypto`. Re-entry clears stored PIN and locks immediately.
* **JWT Auth Service**: Access token (`900s` TTL) and refresh token (`2592000s` TTL) rotation working against `backend/auth/crypto.js`.
* **State Persistence**: Browser refresh retains active user identity and workspace state.

### 2. Financial Engines Verification
* **TWR & XIRR**: Calculated using daily cash-flow weighted time returns and iterative Newton-Raphson method (`performanceEngine.ts`). Verified against golden test fixtures.
* **Section 70/74 Tax Harvesting**: Indian statutory capital gains rules (₹1.25L LTCG tax-free threshold under Budget 2024 updates). Calculates exact loss set-off options.
* **Brinson Attribution**: Allocation effect, selection effect, and interaction effect evaluated against benchmark indices (Nifty 50, BSE Sensex, CRISIL Composite).
* **Monte Carlo Goal Engine**: 1,000 randomized path simulations computing success probability, inflation-adjusted target values, and SIP shortfall.

### 3. Data Flow & CRUD Persistence
* **Clients CRUD**: Add client, edit profile, assign risk score, update contact details -> Persisted immediately.
* **Holdings & CAS Import**: Import CAS text / CSV statement -> Holdings parsed into equities, mutual funds, gold, and fixed income -> Portfolio valuation updates downstream.
* **What-If Scenarios**: Market shock simulations compute portfolio impact on non-mutating transient copies.

---

## Regression Verification Suite
* **Unit Tests**: 295 / 295 Passed (`npm test`)
* **TypeScript Check**: 0 errors (`npm run typecheck`)
* **Backend Node Syntax**: 0 errors (`node --check backend/server.js`)
