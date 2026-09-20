# Asset Array 💼📈

[![Version 3.3.1](https://img.shields.io/badge/Version-3.3.1-E0A84C?style=for-the-badge&logo=git&logoColor=white)](https://github.com/SakshamJ01/AssetArray)
[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-asset--array.web.app-E0A84C?style=for-the-badge&logo=firebase&logoColor=white)](https://asset-array.web.app)
[![Live Backend API](https://img.shields.io/badge/API-assetarray.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://assetarray.onrender.com/api/health)
[![Cloud Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://cloud.mongodb.com)

[![CI Pipeline](https://github.com/SakshamJ01/AssetArray/actions/workflows/ci.yml/badge.svg)](https://github.com/SakshamJ01/AssetArray/actions)
[![RevenueCat](https://img.shields.io/badge/Monetization-RevenueCat-orange.svg)](https://www.revenuecat.com/)
[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo%20%2F%20React%20Native-blue.svg)](https://expo.dev/)
[![Gemini & Ollama AI](https://img.shields.io/badge/AI-Google%20Gemini%20%2B%20Ollama-8E75B2.svg)](https://ai.google.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-466%20Passed%20(85%20Suites)-22c55e.svg)](https://github.com/SakshamJ01/AssetArray)

![Asset Array Hero Banner](assets/hero-thumbnail.jpg)

**AssetArray** is an institutional-grade wealth management & advisor operating system engineered for wealth managers, RIAs, family offices, and financial advisors. It unifies portfolio analytics, risk intelligence, tax estimation, client 360 dossiers, AI decision support, zero-PII statement parsing, and governance into a seamless cross-platform solution.

Engineered with a high-contrast **Obsidian & Champagne Gold** luxury aesthetic (`#030712` / `#E0A84C`), dual-mode **Swiss Private Banking** light theme, real-time stochastic share market streaming engine, client-side zero-knowledge AES-256 encryption, multi-user cloud synchronization, responsive web/desktop/mobile UX, and built-in subscription monetization powered by **RevenueCat**.

> **Important Positioning & Regulatory Disclosure**:  
> AssetArray uses performance methodologies informed by GIPS® concepts but is not itself claiming GIPS compliance, certification, or verification. AssetArray provides advisor governance, decision-support, privacy, and analytical tooling; regulatory status, fiduciary responsibility, suitability determination, and compliance adherence remain the sole responsibility of the advisor or registered firm.

---

## 🌐 Live Production Deployments

| Tier | Provider | Live URL | Health / Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Firebase Hosting (Global CDN) | [asset-array.web.app](https://asset-array.web.app) | 🟢 Live Production SPA |
| **Backend API** | Render (Node.js Express) | [assetarray.onrender.com](https://assetarray.onrender.com) | 🟢 [Health Status Check](https://assetarray.onrender.com/api/health) |
| **Cloud Database** | MongoDB Atlas (Cloud Replica) | AWS Cloud Cluster | 🟢 Encrypted Storage Active |
| **PDF Documentation** | Workspace PDF Artifact | `AssetArray_Full_Project_Documentation.pdf` | 🟢 PDF Generated |

---

## 📖 Complete Exhaustive Feature & Functionality Directory

Below is the deep, exhaustive breakdown of **every single feature, tool, workflow, and micro-functionality** built into AssetArray:

---

### 1. 🔑 Authentication, Security & Access Control
* **Manual Cloud Backend Sign-In**: Username and password login against the Render backend (`/api/auth/login`) returning JWT access and refresh token pairs.
* **Auto-Fill Cloud Backend URL**: One-tap URL population shortcut (`https://assetarray.onrender.com`) for production cloud environment connection.
* **JWT Access & Refresh Token Lifecycle**: Automatic silent token renewal (`/api/auth/refresh`) on `401 Unauthorized` responses via `refreshAccessTokenIfNeeded()`.
* **Logout & Session Revocation**: Securely invalidates refresh tokens on the server (`/api/auth/logout`) and purges local session tokens from device storage.
* **Hardware PIN Setup & Lock Screen**: 4-digit PIN setup persisted via `expo-secure-store` with auto-lock screen verification.
* **Biometric Authentication**: Hardware unlock via Apple Face ID / Touch ID or Android Biometrics using `expo-local-authentication`.
* **Haptics & Tactile Feedback**: Customizable selection and notification haptics using `expo-haptics` with user preference persistence.
* **Dual Luxury Theme Engine**: High-contrast Obsidian & Champagne Gold dark theme (`#030712`) and Swiss Private Banking light theme.
* **Client-Side Zero-Knowledge Encryption**: End-to-end AES-256 client payload encryption before cloud transmission using PIN-derived cryptographic keys.
* **Backend Environment Security Hardening**: Strict production rules requiring non-default `TOKEN_SECRET`, `REFRESH_SECRET`, and domain-restricted `CORS_ORIGIN`.

---

### 2. 👤 Client 360 Workspace & Roster Management
* **Comprehensive Client Roster**: Filterable cards and tables displaying client name, category, risk profile, priority, city, allocation, and reminder dates.
* **Multi-Attribute Search & Filter**: Real-time search across client names, emails, phone numbers, cities, and risk profiles.
* **Category Filters**: Instant segmentation by category (*All*, *HNI*, *Ultra HNI*, *Retail*, *Institutional*).
* **Mode Filters**: Quick filtering by *All Clients*, *Due Reminders*, and *High Priority*.
* **Client Onboarding & Creation Modal**: Comprehensive draft editor capturing Name, Phone, Email, Category, Risk Profile, Preferred Channel (Email/WhatsApp/SMS), Watchlist Tickers, City, Target Asset Allocation, Contact Reminder Date, Priority Level, and Notes.
* **Client Dossier Editor**: Edit existing client records and instantly persist updates across local storage and cloud state.
* **Client Deletion**: Safe deletion workflow with confirmation prompt to prevent accidental data loss.
* **Bulk Client Selection**: Multi-select checkbox matrix for batch operations and campaign outreach.
* **Contact Reminder Engine**: Automatic detection and visual highlighting of overdue or scheduled client touchpoints.
* **Client Contact & Interaction Log**: Historical interaction log recording date and summary notes per client.

---

### 3. 📄 1-Click Statement & CAS Importer Engine (Zero-PII)
* **Multi-Broker Statement Support**: Automated parsing engine for **Zerodha**, **Groww**, **CAMS**, and **NDSL eCAS** consolidated account statements (`src/services/statementParser.ts`).
* **Zero-PII Redaction Layer**: Integrated `sanitizePii()` function scrubbing PAN numbers, Aadhaar IDs, email addresses, and mobile numbers in accordance with DPDP Act 2023.
* **Prominent Button Placement**: Accessible via:
  1. **Desktop Sidebar**: `📥 Import Statement (CAS)` button under `DESK ACTIONS`.
  2. **Client Roster Header**: Blue `📥 Import Statement` button next to `+ Client`.
  3. **Portfolios Workstation Bar**: Blue `📥 Import Statement` button next to `Rebalance`.
* **Smart Asset Categorization**: Automatically maps parsed securities into Equities, Mutual Funds, Fixed Income, Commodities, and Cash.

---

### 4. 📊 Portfolio Analytics, Valuation & Performance Engine
* **Multi-Asset Class Support**: Tracks positions across 8 asset classes: Equities, Mutual Funds, Fixed Income, Commodities, Cash & Equivalents, Crypto, Real Estate, and International Assets.
* **Holding Creation & Editing**: Add/edit position details including Asset Name, Asset Class, Ticker, Quantity, Invested Value, Current Market Value, Target Weight %, and Notes.
* **Real-Time Live Valuation Sync**: Client portfolio market values (`currentValue = price * quantity`) dynamically update live as market securities tick.
* **Time-Weighted Return (TWR) Engine**: GIPS-informed sub-period return calculation isolating external cash flows (`src/services/performance/twr.ts`).
* **Money-Weighted Return (XIRR) Engine**: Exact Newton-Raphson cash-flow yield calculation (`src/services/performance/xirr.ts`).
* **Visual Holdings Treemap / Heatmap**: Interactive area-proportional rectangular tiles displaying asset weights and return performance.
* **Portfolio Rebalancing Studio**: Automated rebalance engine calculating current vs. target weight drift and generating exact Buy/Sell order lists (`src/services/rebalancer.ts`).

---

### 5. 📈 Real-Time Live Share Market Ticker & Level-2 Terminal
* **Live Micro-Flash Header Ticker**: Top bar streaming ticks for **Equities & Indices** (`RELIANCE`, `TCS`, `INFY`, `BANKNIFTY`, `NIFTY 50`, `SENSEX`), **Sovereign Gold & Bonds** (`SGB_GOLD`, `BHARATBOND30`, `IN_10Y_GSEC`), **FX** (`USD/INR`), and **Crypto** (`BTC/USD`, `ETH/USD`).
* **Stochastic Brownian Ticking Engine**: Simulated realistic exchange micro-movement with green/red micro-glow animations matching exchange tick sizes.
* **Level-2 Depth Terminal (`LiveMarketDepthModal`)**: Top 5 Bid & Ask order book depth with live quantities, buy/sell volume pressure gauge, intraday 30-tick SVG sparklines, day high/low range slider, and simulated trade execution.
* **Official AMFI NAV Integration (`AmfiNavProvider`)**: Ingests official Indian Mutual Fund Net Asset Values from AMFI India endpoints.
* **Live Finnhub Market Data (`FinnhubProvider`)**: Real US/global equity quotes and FX via the Finnhub API. Gated on `EXPO_PUBLIC_FINNHUB_API_KEY`; unconfigured or free-tier-unreachable symbols degrade honestly to `UNAVAILABLE` with **zero fabricated prices**.
* **Multi-Provider Market Aggregator (`unifiedMarketProvider`)**: Automatic failover across Finnhub, Alpha Vantage, AMFI, and local stochastic ticker with 15s quote caching and freshness labels (`LIVE` / `DELAYED` / `STALE` / `UNAVAILABLE`).

---

### 6. 🛡️ Institutional Risk Intelligence & Portfolio Health Score
* **0–100 Portfolio Health Score Diagnostic (`calculateHealthScore`)**: Multi-pillar rating evaluating:
  1. *Data Completeness*
  2. *Asset Diversification (HHI Entropy)*
  3. *Single-Asset Concentration Defense*
  4. *Geographic & Currency Spread*
  5. *Liquidity & Debt Management*
  * A holding-free portfolio is flagged `INSUFFICIENT_DATA` and renders an honest **NO DATA** empty state instead of a fabricated score.
* **Modern Portfolio Theory (MPT) Risk Metrics**: Computes Portfolio Volatility (Standard Deviation), Sharpe Ratio, Beta against Benchmark, Max Drawdown, and High Watermark.
* **Multi-Benchmark Comparison**: Benchmarks client performance against NIFTY 50, CRISIL Hybrid 65:35, and S&P 500.

---

### 7. 🏛️ Brinson-Fachler Performance Attribution Engine
* **Alpha Decomposition**: Mathematically breaks active portfolio outperformance/underperformance into **Allocation Effect**, **Selection Effect**, and **Interaction Effect**.
* **Plain-Language Explainability**: Auto-generates narrative summaries detailing top alpha drivers and drag positions.
* **Honest Empty State**: An asset-free portfolio renders a dedicated empty panel instead of a fabricated factor/bps table — the model never implies a measured alpha it did not compute.

---

### 8. ⚖️ Indian Tax Intelligence & Loss Harvesting (AY 2026-27 / FY 2025-26)
* **Section 112A LTCG Tax Engine**: 12.5% tax rate calculation on long-term equity gains above the ₹1,25,000 statutory exemption limit.
* **Section 111A STCG Tax Engine**: 20.0% tax rate calculation on short-term equity gains.
* **Section 70 & 74 Set-off & Carry-Forward Engine**: Enforces statutory intra-head and inter-head gain/loss offset rules.
* **Tax Lot FIFO/LIFO Evaluation**: Evaluates individual buy/sell tax lots for term classification (LTCG > 12 months for equity, STCG <= 12 months).
* **1-Click Tax Loss Harvesting Plan**: Identifies loss positions, computes immediate tax savings, and provides 30-day wash-sale protection guidance.

---

### 9. 🎯 What-If Macro Scenario Sandbox & Stress Testing
* **Historical Crisis Presets (`PRESET_SCENARIOS`)**: Simulates shocks including *2008 GFC Crunch*, *Tech Correction*, *1970s Stagflation*, and *Emerging Markets Liquidity Boom*.
* **Custom Shock Sliders**: Allows advisors to tweak equity market drops, interest rate shifts, and FX movements.
* **Outcome Distribution & Tail Risk**: Computes P5 (worst-case tail risk), P50 (median NAV), P95 (resilience NAV), and post-shock Sharpe ratio shifts.

---

### 10. 🎲 1,000-Path Monte Carlo Wealth Simulator
* **Mulberry32 PRNG Generator**: Reproducible, seedable 1,000-run stochastic path simulation (`src/services/monteCarlo.ts`).
* **Statistical Probability of Success**: Computes exact percentage probability of achieving target wealth goals.
* **Percentile Trajectories**: Displays 10th (pessimistic), 50th (median), and 90th (optimistic) percentile visual curves.

---

### 11. 🤖 Conversational AI Wealth Copilot & AI Advisor Brief
* **Multi-Provider AI Gateway (`AiRouter`)**: Routes AI prompts across Google Gemini (`gemini-2.5-flash`, `gemini-2.5-pro`), OpenAI, Anthropic, and local Ollama daemon (`qwen3:4b`, `llama3.2`).
* **Dynamic Ollama Provider**: Dynamic local model discovery (`getActiveModel()`) for zero-latency, local AI copilot execution.
* **Zero-Knowledge PII Sanitization**: Replaces client names and PII with deterministic tokens (e.g. `Client Ref #AA-881`) aligned with DPDP Act 2023.
* **AI Output Grounding (`validateClaimsAgainstContext`)**: Verifies numerical claims in AI responses against actual portfolio data.
* **Floating Conversational Copilot (`AiWealthCopilot`)**: Context-aware chat assistant answering portfolio queries, rebalancing questions, and risk breakdowns.

---

### 12. 📄 Executive PDF Report Studio & Client Shareable Portal
* **On-Device PDF Generation**: Generates high-resolution branded PDF portfolio summary reports using `expo-print` and `expo-sharing`.
* **Advisor Branding & Stamping**: Stamps advisor credentials, disclaimers, asset breakdowns, and contact information.
* **Shareable Client Portal (`ClientPortalModal`)**: Generates read-only investor dossier for client review.

---

### 13. 🧮 Comprehensive Financial Calculators Center
* **SIP Calculator**: Computes future wealth, total invested amount, and wealth gain for systematic investment plans.
* **Cash Flow Calculator**: Models cumulative and payout cash flows.
* **Retirement Calculator**: Estimates required retirement corpus based on inflation, current expenses, and post-retirement yield.
* **Financial Goal Center**: Computes required monthly savings to achieve target goal values.

---

### 14. 💳 Pro Advisor Monetization (RevenueCat)
* **Native In-App Purchases (`react-native-purchases`)**: Integrated RevenueCat SDK supporting iOS App Store, Google Play, and Web Test Store sandbox.
* **Pro Paywall Modal (`PaywallScreen`)**: Conversion-optimized paywall supporting Monthly and Annual subscription tiers.
* **Entitlement Gating (`pro_advisor`)**: Gates access to AI Portfolio Co-Pilot and Unlimited PDF Exports.

---

### 15. ☁️ Enterprise End-to-End Cloud Synchronization
* **E2EE Cloud Sync (`syncToCloud`, `restoreFromCloud`)**: Pushes/pulls AES-256 encrypted payloads to MongoDB Atlas via Render API.
* **Live Sync Status Badge (`SyncBadge`)**: Real-time header badge displaying `SYNCING`, `OFFLINE`, `ERROR`, or `SYNCED`.
* **Zero-Cache Firebase CDN Config**: `firebase.json` headers enforcing `no-cache, no-store, must-revalidate` on SPA routes to guarantee immediate bundle updates.

---

## 🏗️ Architecture & Platform Stack

```
AssetArray/
├── App.tsx                              # Root layout, live ticker sync, navigation orchestration
├── firebase.json                        # Firebase Hosting configuration with SPA rewrites & zero-cache headers
├── render.yaml                          # Render.com Web Service Blueprint CI/CD
├── scripts/
│   ├── postbuild.js                     # Service worker cleanup, font preconnect & dark reset injector
│   ├── generate-pdf-docs.js             # Headless Chrome script generating full project PDF documentation
│   └── check-live.js                    # Live HTTP response & JS bundle status checker
├── src/
│   ├── components/
│   │   ├── DesktopSidebar.tsx           # Desktop navigation sidebar with Quick Import Statement button
│   │   ├── LiveMarketTicker.tsx         # Real-time ticking header with micro-flash animations
│   │   ├── AiWealthCopilot.tsx          # Floating conversational AI copilot (Gemini + Ollama)
│   │   └── modals/
│   │       ├── StatementImportModal.tsx # 1-Click Zero-PII CSV/Statement parser
│   │       ├── LiveMarketDepthModal.tsx # Level 2 Orderbook Depth Terminal
│   │       ├── MonteCarloModal.tsx      # 1,000-run statistical simulation studio
│   │       └── RebalanceModal.tsx       # Institutional portfolio rebalancing
│   ├── screens/
│   │   ├── ClientsScreen.tsx            # Search, filter, client dossier & roster header import
│   │   ├── PortfoliosScreen.tsx         # Unified portfolio analytics & action bar statement import
│   │   └── PaywallScreen.tsx            # RevenueCat Pro Advisor Paywall UI
│   └── services/
│       ├── statementParser.ts           # Zero-PII CAMS/Zerodha/Groww/NDSL statement parser
│       ├── realTimeMarket.ts            # Ticker engine (BANKNIFTY, SGB_GOLD, BHARATBOND30)
│       └── aiGateway/providers/ollama.ts# Local Ollama AI streaming provider
└── __tests__/                           # 85 passing Jest test suites (466 total unit/E2E tests)
```

---

## 🚀 Getting Started

### 1. Run local development app
```bash
git clone https://github.com/SakshamJ01/AssetArray.git
cd AssetArray
npm install
npm run web
```

### 1b. Optional market data keys (root `.env`)
Live market quotes are **key-gated and fully optional** — the app runs without them. To enable live Finnhub US/global equity quotes, create a **root-level** `.env` (gitignored) and add:
```env
EXPO_PUBLIC_FINNHUB_API_KEY=your_finnhub_token
```
Then rebuild (`npm run web` / `npm run deploy:web`).

> **Build-time inlining note**: Expo's Metro bundler only inlines `EXPO_PUBLIC_*`
> values for **direct** member access (`process.env.EXPO_PUBLIC_X`). Optional
> chaining (`process.env?.EXPO_PUBLIC_X`) is not statically replaced and
> resolves to `undefined` in the browser, so the Finnhub-gating paths use
> guarded direct access to keep the key live in the web bundle.
>
> Free-tier Finnhub covers US/global equities and FX but **not** Indian equities
> or daily candles. Indian holdings price via the always-active AMFI NAV feed;
> unsupported symbols return `UNAVAILABLE` with no fabricated price.

**Secrets safety**: the root `.env` is gitignored and must never be committed.
`backend/.env` (backend-only keys like `GEMINI_API_KEY`) is likewise ignored.

### 2. Generate Full Project PDF Documentation
```bash
node scripts/generate-pdf-docs.js
# Generates AssetArray_Full_Project_Documentation.pdf in project root
```

### 3. Deploy Web App to Firebase Hosting
```bash
npm run deploy:web
```

### 4. Run Automated Test Verification
```bash
# Run full 85-suite Jest test regression (466 tests passing)
npm test

# Run the canonical 7-gate verification (tsc, backend syntax, tests,
# AI audit, desktop E2E, mobile audit, production build)
npm run verify:all

# TypeScript typecheck
npm run typecheck
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
