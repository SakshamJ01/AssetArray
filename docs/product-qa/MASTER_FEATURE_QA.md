# AssetArray — Master Feature QA Matrix

**Release Family**: 3.3.x  
**Repository**: `https://github.com/SakshamJ01/AssetArray`  
**Branch**: `main`  
**Web App Target**: `https://asset-array.web.app`  
**Backend Target**: `https://assetarray.onrender.com`  

---

## Master Capability & Feature Audit Matrix

| Feature ID | Category | Feature Name | Entry Point | UI Component | Primary Service / Engine | Desktop | Tablet | Mobile | Functional Status | Persistence | AI / Provider |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **AUTH-01** | AUTH | PIN Security Lock | Initial App Mount | `AppLockModal` | `storageService` / `crypto` | PASS | PASS | PASS | PASS | `AsyncStorage` | N/A |
| **AUTH-02** | AUTH | Advisor JWT Login | Settings / Auth Drawer | `AuthLoginModal` | `secureSync` / `authCrypto` | PASS | PASS | PASS | PASS | Secure Token | N/A |
| **AUTH-03** | AUTH | Token Refresh & Expiry | Background / Middleware | `requireAuth` | `backend/auth/crypto.js` | PASS | PASS | PASS | PASS | JWT Expire | N/A |
| **CMD-01** | WORKSPACE | Daily Advisor Briefing | Command Center | `AdvisorCommandCenter` | `advisor/dailyBrief.ts` | PASS | PASS | PASS | PASS | Memory / Sync | Gemini / Ollama / Rule Engine |
| **CMD-02** | WORKSPACE | Smart Priority Matrix | Command Center | `AdvisorCommandCenter` | `advisor/actionEngine.ts` | PASS | PASS | PASS | PASS | Memory | Deterministic Rules |
| **CLI-01** | CLIENTS | Client Roster & Search | Clients Screen | `ClientsScreen` | `client360.ts` | PASS | PASS | PASS | PASS | `storageService` | N/A |
| **CLI-02** | CLIENTS | Client Editor Modal | Client List / Header | `ClientEditorModal` | `storageService` | PASS | PASS | PASS | PASS | Persisted | N/A |
| **CLI-03** | CLIENT 360 | Consolidated Net Worth | Client 360 | `Client360` view | `calculators.ts` | PASS | PASS | PASS | PASS | Calculated | N/A |
| **CLI-04** | CLIENT 360 | AI Client Explainer | Client 360 | `AiWealthCopilot` | `aiGateway/router.ts` | PASS | PASS | PASS | PASS | Session | Gemini / Ollama |
| **PORT-01** | PORTFOLIO | Valuation & Holdings | Portfolios Screen | `PortfoliosScreen` | `performanceEngine.ts` | PASS | PASS | PASS | PASS | Persisted | AMFI / Market Quotes |
| **PORT-02** | PORTFOLIO | TWR & XIRR Calculation | Performance Tab | `PortfoliosScreen` | `performanceEngine.ts` | PASS | PASS | PASS | PASS | Calculated | Deterministic Math Engine |
| **PORT-03** | PORTFOLIO | Holding Editor & CAS Import| Portfolio Toolbar | `HoldingEditorModal` | `statementParser.ts` | PASS | PASS | PASS | PASS | Persisted | N/A |
| **RISK-01** | RISK | Risk Metrics & Drawdown | Risk Tab / Screen | `RiskScreen` | `riskAnalytics.ts` | PASS | PASS | PASS | PASS | Calculated | N/A |
| **RISK-02** | RISK | Macro Stress Testing | Risk Screen | `StressTestModal` | `stressTesting.ts` | PASS | PASS | PASS | PASS | Calculated | CRISIS_SCENARIOS |
| **TAX-01** | TAX | Sec 70/74 Tax Harvesting | Tax Screen | `TaxScreen` | `taxIntelligence.ts` | PASS | PASS | PASS | PASS | Calculated | Statutory Tax Engine |
| **GOAL-01** | GOALS | Monte Carlo Goal Engine | Goals Screen | `GoalsScreen` | `monteCarlo.ts` | PASS | PASS | PASS | PASS | Persisted | 1,000 Sim Runs |
| **SCEN-01** | SCENARIOS | What-If Market Sandbox | Scenarios Screen | `ScenariosScreen` | `scenarioEngine.ts` | PASS | PASS | PASS | PASS | Sandbox State | Non-mutating |
| **MKT-01** | MARKETS | Live Ticker & Quotes | Global Header | `LiveMarketTicker` | `realTimeMarket.ts` | PASS | PASS | PASS | PASS | WebSocket / Cache| AMFI / Market Feeds |
| **AI-01** | AI | Multi-Tier Gateway | Floating AI FAB | `AiWealthCopilot` | `aiGateway/router.ts` | PASS | PASS | PASS | PASS | Streamed | Gemini Free -> Ollama -> Rule |
| **AI-02** | AI | Research Grounding | Research Desk | `AiResearchResult` | `aiGateway/router.ts` | PASS | PASS | PASS | PASS | Grounded | AMFI / Public Regulators |
| **REP-01** | REPORTS | PDF Report Exporter | Client 360 / Reports | `exportClientPdfReport` | `pdfReport.ts` | PASS | PASS | PASS | PASS | Download / Print | Multi-currency (INR/USD/EUR) |
| **SYNC-01** | SYNC | Zero-Knowledge Cloud Backup| Settings / Header | `SyncConfigModal` | `secureSync.ts` | PASS | PASS | PASS | PASS | Encrypted Vault| PBKDF2 + AES Cipher |

---

## Status Classification
* **Total Features Audited**: 22 Primary Feature Subsystems (100% Covered)
* **PASS**: 22 / 22
* **FAILED**: 0
* **DEMO / SIMULATED**: Clearly tagged on simulated market data streams
