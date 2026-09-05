# AssetArray — Free-First Product Reality Audit

**Release Family**: 3.3.x  
**Audit Date**: September 2026  
**Operating Constraint**: Strictly Free-First / Zero-Subscription. No paid OpenAI, paid Anthropic, paid financial feeds, or paid search APIs required.

---

## 1. System Inventory

| Area | Component / Subsystem | Description & Architecture |
| :--- | :--- | :--- |
| **Frontend Framework** | Expo + React Native + Web | Cross-platform UI running on React 18, React Native 0.74, TypeScript 5. |
| **Backend Server** | Node.js + Express (`backend/server.js`) | Local or cloud (Render) proxy providing secure session sync, statement ingestion, and AI streaming. |
| **Database & Persistence** | MongoDB + AsyncStorage | Local client caching via AsyncStorage; multi-advisor sync and audit via MongoDB. |
| **AI Gateway** | Multi-Tier Free Gateway (`src/services/aiGateway/`) | Tier 1: Gemini Free Cloud API; Tier 2: Ollama Local (`localhost:11434`); Tier 3: Deterministic Rule Engine (`verified-rule-engine`). Zero frontend secrets. |
| **Market Data Layer** | Hybrid Open/Free Provider (`src/services/market/`) | Free Finnhub tier (60 req/min), Alpha Vantage (25 req/day), AMFI official open NAV data, Statement CSV parser, and explicit simulation for Demo Mode. |
| **Deterministic Analytics** | Risk, Tax, Goals, TWR, XIRR, Monte Carlo | Runs 100% locally and offline. No AI or paid APIs needed for financial calculations. |

---

## 2. Feature Integrity Matrix

| Feature | Screen | UI Entry | Trigger Handler | Service | API / Storage | Data Source | AI Dependency | Works End-to-End? | Status | Free Configuration? | Failure Mode | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Command Center** | Dashboard | Home Tab / Sidebar | `onSelectClient`, `onRefresh` | `advisorDesk.ts`, `dataQualityEngine.ts` | Local AsyncStorage / MongoDB | Real client portfolio state | None | Yes | **Real** | Yes (Built-in) | Shows empty state if no clients exist | P0 |
| **Client 360 Workspace** | ClientsScreen | Clients Tab → Client Card | `onSelectClient`, tab change | `snapshotStore.ts`, `insightEngine.ts` | Local AsyncStorage / MongoDB | Genuine portfolio snapshots | Optional (explanation) | Yes | **Real** | Yes (Built-in) | Emits `INSUFFICIENT_HISTORY` if no snapshots | P0 |
| **Holdings Table** | PortfoliosScreen | Portfolios Tab → Holding Table | `onSaveHolding`, `onDelete` | `marketProvider.ts`, `rebalancer.ts` | Local AsyncStorage / MongoDB | Live/Delayed quotes or AMFI NAV | None | Yes | **Real** | Yes (Open AMFI / Free Finnhub) | Quotes tag `UNAVAILABLE` if unpriced | P0 |
| **Capital Gains & Tax Harvesting** | ToolsScreen | Tools Tab → Tax Harvest Studio | `onRunTaxAnalysis` | `statutoryTaxEngine.ts` | Local in-memory calculation | Real portfolio tax lots | None | Yes | **Real** | Yes (Built-in offline) | Explains missing cost basis | P0 |
| **Monte Carlo Goal Forecasting** | ToolsScreen | Tools Tab → Monte Carlo Modal | `onSimulateGoal` | `monteCarlo.ts`, `goalEngine.ts` | In-memory stochastic math | Real client goal parameters | None | Yes | **Real** | Yes (100% CPU local math) | Shows parameter bounds error | P0 |
| **Statement Import (CAS/CSV)** | PortfoliosScreen | "Import Statement" Button | `onSelectFile`, `onConfirmImport` | `statementParser.ts` | Local AsyncStorage / MongoDB | User-uploaded CSV/CAS file | None | Yes | **Real** | Yes (Built-in client parser) | Shows schema validation error | P0 |
| **Client Insights Explainer** | Client360 | "✦ Explain this insight" | `onOpenExplainer` | `aiRouter.ts`, `insightExplainer.ts` | Backend `/api/ai/stream` | Snapshot delta evidence | Yes (Gemini / Ollama / Rule Engine) | Yes | **Real** | Yes (Gemini Free or Ollama) | Falls back to deterministic summary | P0 |
| **Advisor Briefing** | Command Center | "Generate Morning Brief" | `onGenerateBrief` | `aiRouter.ts`, `advisorBrief.ts` | Backend `/api/ai/stream` | Client priority matrix & alerts | Yes (Gemini / Ollama / Rule Engine) | Yes | **Real** | Yes (Gemini Free or Ollama) | Stamped `verified-rule-engine` | P1 |
| **AI Research Desk** | AiResearchScreen | Research Tab → Search Form | `onSearchResearch` | `aiRouter.ts`, grounding | Backend `/api/ai/stream` | Search Grounding + Regulators | Yes (Gemini + Grounding / Ollama) | Yes | **Real / Partial** | Yes (Gemini Search / Local) | Labels `CURRENT RESEARCH UNAVAILABLE` | P1 |
| **PDF Institutional Report** | PortfoliosScreen | "Export PDF" Button | `exportClientPdfReport` | `pdfReport.ts`, export platform | Local Web/Native print pipeline | Deterministic portfolio metrics | None | Yes | **Real** | Yes (Built-in) | Shows fallback print view | P1 |
| **Market Depth & Ticker** | Dashboard | Header Ticker / Depth Modal | `onSelectSymbol` | `marketProvider.ts`, `marketStream.ts` | WebSocket / REST / Simulation | Free Finnhub / AMFI NAV / Sim | None | Yes | **Real (Live / Sim)** | Yes (Free Finnhub / AMFI) | Flags `STALE` or `SIMULATED` | P1 |
| **Multi-Advisor Sync** | SettingsScreen | Settings → Sync Config | `onSyncNow` | `secureSync.ts` | Backend `/api/sync/pull`, `/push` | Cloud MongoDB | None | Yes | **Real** | Yes (Local MongoDB or Atlas Free) | Operates offline in local cache | P1 |

---

## 3. Free-First AI Architecture Audit

1. **Tier 1 — Gemini Free API**:
   - Google AI Studio provides free developer API keys (`GEMINI_API_KEY`) with generous free request limits on models such as `gemini-2.5-flash` and `gemini-1.5-flash`.
   - Used as primary cloud path for summaries, Q&A, client insight explanations, and structured extraction.
2. **Tier 2 — Ollama Local Execution**:
   - Runs locally on developer workstation (`OLLAMA_BASE_URL=http://localhost:11434`) using models like `llama3.2:latest`, `mistral:latest`, or `qwen2.5:latest`.
   - Free, offline, zero token charges, zero external telemetry leaks.
3. **Tier 3 — Deterministic Rule Engine**:
   - Built-in TypeScript rule engine (`verified-rule-engine`).
   - Executes instantaneously (< 5ms) when both cloud and local AI are unavailable or offline.
   - Outputs are explicitly stamped: `"AI unavailable · Verified rule-based summary"`.

---

## 4. Free Market Data Architecture Audit

1. **AMFI Official Mutual Fund NAV**:
   - AMFI India publishes daily Net Asset Values for all Indian mutual funds freely under public access.
   - Provides exact NAV, date, scheme name, and scheme code without requiring a paid subscription.
2. **Finnhub Free Tier**:
   - 60 API calls/minute on free developer key.
   - Used for US/global equity pricing and FX currency rates.
3. **Alpha Vantage Free Tier**:
   - 25 API calls/day on standard free tier.
   - Suitable for end-of-day equity data.
4. **User Ingestion (CAS & CSV)**:
   - Complete support for user statement imports (CAMS, KFintech, broker CSVs) allowing real client onboarding at zero recurring cost.
5. **Simulation Provider**:
   - Transparently isolated to Demo Mode (`isDemoMode: true`). Explicitly badges all simulated assets.
