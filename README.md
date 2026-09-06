# Asset Array 💼📈

[![Version 3.3.1](https://img.shields.io/badge/Version-3.3.1-E0A84C?style=for-the-badge&logo=git&logoColor=white)](https://github.com/SakshamJ01/AssetArray)
[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-asset--array.web.app-E0A84C?style=for-the-badge&logo=firebase&logoColor=white)](https://asset-array.web.app)
[![Live Backend API](https://img.shields.io/badge/API-assetarray.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://assetarray.onrender.com/api/health)
[![Cloud Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://cloud.mongodb.com)

[![CI Pipeline](https://github.com/SakshamJ01/AssetArray/actions/workflows/ci.yml/badge.svg)](https://github.com/SakshamJ01/AssetArray/actions)
[![RevenueCat](https://img.shields.io/badge/Monetization-RevenueCat-orange.svg)](https://www.revenuecat.com/)
[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo%20%2F%20React%20Native-blue.svg)](https://expo.dev/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)](https://ai.google.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-100%20Passed-22c55e.svg)](https://github.com/SakshamJ01/AssetArray)

![Asset Array Hero Banner](assets/hero-thumbnail.jpg)

**AssetArray** is an institutional-grade wealth management & advisor operating system engineered for wealth managers, RIAs, family offices, and financial advisors. It unifies portfolio analytics, risk intelligence, tax estimation, client 360 dossiers, AI decision support, and governance into a seamless cross-platform solution.

Engineered with a high-contrast **Obsidian & Champagne Gold** luxury aesthetic, dual-mode **Swiss Private Banking** light theme, real-time stochastic share market streaming engine, client-side zero-knowledge AES-256 encryption, multi-user cloud synchronization, responsive web/desktop/mobile UX, and built-in subscription monetization powered by **RevenueCat**.

> **Important Positioning & Regulatory Disclosure**:  
> AssetArray uses performance methodologies informed by GIPS® concepts but is not itself claiming GIPS compliance, certification, or verification. AssetArray provides advisor governance, decision-support, privacy, and analytical tooling; regulatory status, fiduciary responsibility, suitability determination, and compliance adherence remain the sole responsibility of the advisor or registered firm.

---

## 🌐 Live Production Deployments

| Tier | Provider | Live URL | Health / Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Firebase Hosting (Global CDN) | [asset-array.web.app](https://asset-array.web.app) | 🟢 Live Production SPA |
| **Backend API** | Render (Node.js Express) | [assetarray.onrender.com](https://assetarray.onrender.com) | 🟢 [Health Status Check](https://assetarray.onrender.com/api/health) |
| **Cloud Database** | MongoDB Atlas (Cloud Replica) | AWS Cloud Cluster | 🟢 Encrypted Storage Active |

---

## 📖 Complete Exhaustive Feature & Functionality Directory

Below is the deep, exhaustive breakdown of **every single feature, tool, workflow, and micro-functionality** built into AssetArray:

---

### 1. 🔑 Authentication, Security & Access Control
* **1-Click Judge & Demo Sign-In (`quickDemoLogin`)**: Authenticates immediately as the demo advisor without displaying plaintext passwords on screen, enabling instant sandbox evaluation.
* **Manual Cloud Backend Sign-In**: Username and password login against the Render backend (`/api/auth/login`) returning JWT access and refresh token pairs.
* **Auto-Fill Cloud Backend URL**: One-tap URL population shortcut (`https://assetarray.onrender.com`) for production cloud environment connection.
* **JWT Access & Refresh Token Lifecycle**: Automatic silent token renewal (`/api/auth/refresh`) on `401 Unauthorized` responses via `refreshAccessTokenIfNeeded()`.
* **Logout & Session Revocation**: Securely invalidates refresh tokens on the server (`/api/auth/logout`) and purges local session tokens from device storage.
* **Offline Demo Mode (`continueOffline`)**: Instant access to local sandbox state without requiring an active internet connection or cloud backend server.
* **Hardware PIN Setup & Lock Screen**: 4-digit PIN setup persisted via `expo-secure-store` with auto-lock screen verification.
* **Biometric Authentication**: Hardware unlock via Apple Face ID / Touch ID or Android Biometrics using `expo-local-authentication`.
* **Haptics & Tactile Feedback**: Customizable selection and notification haptics using `expo-haptics` with user preference persistence.
* **Dual Luxury Theme Engine**: High-contrast Obsidian & Champagne Gold dark theme and Swiss Private Banking light theme.
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
* **Seed Demo Client Roster**: 1-tap loading of 3 pre-configured institutional client dossiers (Rohan Varma, Devendra Singhal, Ananya Iyer) with realistic portfolios.

---

### 3. 📊 Portfolio Analytics, Valuation & Performance Engine
* **Multi-Asset Class Support**: Tracks positions across 8 asset classes: Equities, Mutual Funds, Fixed Income, Commodities, Cash & Equivalents, Crypto, Real Estate, and International Assets.
* **Holding Creation & Editing**: Add/edit position details including Asset Name, Asset Class, Ticker, Quantity, Invested Value, Current Market Value, Target Weight %, and Notes.
* **Real-Time Live Valuation Sync**: Client portfolio market values (`currentValue = price * quantity`) dynamically update live as market securities tick.
* **Time-Weighted Return (TWR) Engine**: GIPS-informed sub-period return calculation isolating external cash flows (`src/services/performance/twr.ts`).
* **Money-Weighted Return (XIRR) Engine**: Exact Newton-Raphson cash-flow yield calculation (`src/services/performance/xirr.ts`).
* **Visual Holdings Treemap / Heatmap**: Interactive area-proportional rectangular tiles displaying asset weights and return performance.
* **Portfolio Rebalancing Studio**: Automated rebalance engine calculating current vs. target weight drift and generating exact Buy/Sell order lists (`src/services/rebalancer.ts`).

---

### 4. 📈 Real-Time Live Share Market Ticker & Level-2 Terminal
* **Live Micro-Flash Header Ticker**: Top bar streaming ticks for **NSE/BSE Equities** (`RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, `ICICIBANK`), **Indices** (`NIFTY 50`, `SENSEX`, `S&P 500`, `NASDAQ`), **Commodities** (`GOLD`), **FX** (`USD/INR`), and **Crypto** (`BTC/USD`, `ETH/USD`).
* **Stochastic Brownian Ticking Engine**: Simulated realistic exchange micro-movement with green/red micro-glow animations matching exchange tick sizes.
* **Level-2 Depth Terminal (`LiveMarketDepthModal`)**: Top 5 Bid & Ask order book depth with live quantities, buy/sell volume pressure gauge, intraday 30-tick SVG sparklines, day high/low range slider, and simulated trade execution.
* **Official AMFI NAV Integration (`AmfiNavProvider`)**: Ingests official Indian Mutual Fund Net Asset Values from AMFI India endpoints.
* **Multi-Provider Market Aggregator (`unifiedMarketProvider`)**: Automatic failover across Finnhub, Alpha Vantage, AMFI, and local stochastic ticker.
* **Quote Schema Validation**: Strict runtime schema validator filtering out negative prices, `NaN`, `Infinity`, or malformed quotes.

---

### 5. 🛡️ Institutional Risk Intelligence & Portfolio Health Score
* **0–100 Portfolio Health Score Diagnostic (`calculateHealthScore`)**: Multi-pillar rating evaluating:
  1. *Data Completeness*
  2. *Asset Diversification (HHI Entropy)*
  3. *Single-Asset Concentration Defense*
  4. *Geographic & Currency Spread*
  5. *Liquidity & Debt Management*
* **Modern Portfolio Theory (MPT) Risk Metrics**: Computes Portfolio Volatility (Standard Deviation), Sharpe Ratio, Beta against Benchmark, Max Drawdown, and High Watermark.
* **Multi-Benchmark Comparison**: Benchmarks client performance against NIFTY 50, CRISIL Hybrid 65:35, and S&P 500.

---

### 6. 🏛️ Brinson-Fachler Performance Attribution Engine
* **Alpha Decomposition**: Mathematically breaks active portfolio outperformance/underperformance into **Allocation Effect**, **Selection Effect**, and **Interaction Effect**.
* **Plain-Language Explainability**: Auto-generates narrative summaries detailing top alpha drivers and drag positions.

---

### 7. ⚖️ Indian Tax Intelligence & Loss Harvesting (AY 2026-27 / FY 2025-26)
* **Section 112A LTCG Tax Engine**: 12.5% tax rate calculation on long-term equity gains above the ₹1,25,000 statutory exemption limit.
* **Section 111A STCG Tax Engine**: 20.0% tax rate calculation on short-term equity gains.
* **Section 70 & 74 Set-off & Carry-Forward Engine**: Enforces statutory intra-head and inter-head gain/loss offset rules.
* **Tax Lot FIFO/LIFO Evaluation**: Evaluates individual buy/sell tax lots for term classification (LTCG > 12 months for equity, STCG <= 12 months).
* **1-Click Tax Loss Harvesting Plan**: Identifies loss positions, computes immediate tax savings, and provides 30-day wash-sale protection guidance.

---

### 8. 🎯 What-If Macro Scenario Sandbox & Stress Testing
* **Historical Crisis Presets (`PRESET_SCENARIOS`)**: Simulates shocks including *2008 GFC Crunch*, *Tech Correction*, *1970s Stagflation*, and *Emerging Markets Liquidity Boom*.
* **Custom Shock Sliders**: Allows advisors to tweak equity market drops, interest rate shifts, and FX movements.
* **Outcome Distribution & Tail Risk**: Computes P5 (worst-case tail risk), P50 (median NAV), P95 (resilience NAV), and post-shock Sharpe ratio shifts.

---

### 9. 🎲 1,000-Path Monte Carlo Wealth Simulator
* **Mulberry32 PRNG Generator**: Reproducible, seedable 1,000-run stochastic path simulation (`src/services/monteCarlo.ts`).
* **Statistical Probability of Success**: Computes exact percentage probability of achieving target wealth goals.
* **Percentile Trajectories**: Displays 10th (pessimistic), 50th (median), and 90th (optimistic) percentile visual curves.

---

### 10. 🤖 Conversational AI Wealth Copilot & AI Advisor Brief (Google Gemini)
* **Multi-Provider AI Gateway (`AiRouter`)**: Routes AI prompts across Google Gemini (`gemini-2.5-flash`, `gemini-2.5-pro`), OpenAI, Anthropic, and local Ollama daemon (`llama3.2`).
* **Zero-Knowledge PII Sanitization**: Replaces client names and PII with deterministic tokens (e.g. `Client Ref #AA-881`) aligned with India's DPDP Act 2023.
* **AI Output Grounding (`validateClaimsAgainstContext`)**: Verifies numerical claims in AI responses against actual portfolio data.
* **Floating Conversational Copilot (`AiWealthCopilot`)**: Context-aware chat assistant answering portfolio queries, rebalancing questions, and risk breakdowns.
* **AI Investment Committee Memo Studio**: 1-click formal memo generation with executive summary, risk diagnostics, and action plans.
* **AI Research Brief Screen (`AiResearchScreen`)**: Comprehensive research workspace with grounding confidence scores.

---

### 11. 🚨 Smart Alerts & Advisor Command Center
* **Real-Time Policy Guardrails**: Monitors concentration breaches (>20% single position), large drawdowns, health score drops, and tax-loss harvesting windows.
* **Advisor Action Prioritization**: Ranks pending advisor actions by urgency and client impact (`src/services/advisor/prioritization.ts`).

---

### 12. 📄 Executive PDF Report Studio & Client Shareable Portal
* **On-Device PDF Generation**: Generates high-resolution branded PDF portfolio summary reports using `expo-print` and `expo-sharing`.
* **Advisor Branding & Stamping**: Stamps advisor credentials, disclaimers, asset breakdowns, and contact information.
* **Shareable Client Portal (`ClientPortalModal`)**: Generates read-only investor dossier for client review.

---

### 13. 📄 1-Click Statement & CSV Importer
* **Automated Statement Parser (`statementParser.ts`)**: Instant parsing of broker CSVs and text statements.
* **Smart Asset Classification**: Categorizes parsed holdings into Equities, Mutual Funds, Fixed Income, and Commodities.

---

### 14. 🧮 Comprehensive Financial Calculators Center
* **SIP Calculator**: Computes future wealth, total invested amount, and wealth gain for systematic investment plans.
* **Cash Flow Calculator**: Models cumulative and payout cash flows.
* **Retirement Calculator**: Estimates required retirement corpus based on inflation, current expenses, and post-retirement yield.
* **Financial Goal Center**: Computes required monthly savings to achieve target goal values.

---

### 15. 📁 Client Document Vault
* **Category-Indexed Vault**: Storage desk for client documents categorized by KYC, Risk Profile, Agreements, and Reports.
* **Metadata Tracking**: Records upload date, file name, document status, and linked client assignment.

---

### 16. 💳 Pro Advisor Monetization (RevenueCat)
* **Native In-App Purchases (`react-native-purchases`)**: Integrated RevenueCat SDK supporting iOS App Store, Google Play, and Web Test Store sandbox.
* **Pro Paywall Modal (`PaywallScreen`)**: Conversion-optimized paywall supporting Monthly and Annual subscription tiers.
* **Entitlement Gating (`pro_advisor`)**: Gates access to AI Portfolio Co-Pilot and Unlimited PDF Exports.
* **Subscription Management**: Purchase restoration and built-in sandbox entitlement reset toggle in Settings.

---

### 17. ☁️ Enterprise End-to-End Cloud Synchronization
* **E2EE Cloud Sync (`syncToCloud`, `restoreFromCloud`)**: Pushes/pulls AES-256 encrypted payloads to MongoDB Atlas via Render API.
* **Live Sync Status Badge (`SyncBadge`)**: Real-time header badge displaying:
  * 🔵 `SYNCING...` (Active sync in progress)
  * 🟡 `OFFLINE` (Device offline)
  * 🔴 `ERROR` (Sync/Restore error)
  * 🟢 `SYNCED` (Backup synced)

---

### 18. 🌐 Cross-Platform Responsive UX & Multi-Currency
* **Responsive Desktop & Mobile Layouts**: Features `DesktopSidebar` on web/desktop and `BottomTabBar` on mobile.
* **Multi-Currency Support**: Instant switching and persistence across **INR (₹)**, **USD ($)**, **EUR (€)**, and **GBP (£)**.
* **Broadcast Communication Modal (`BroadcastModal`)**: Multi-client campaign preview for Email, WhatsApp, and SMS outreach.

---

## 🏗️ Architecture & Platform Stack

```
AssetArray/
├── App.tsx                              # Root layout, live ticker sync, navigation orchestration
├── firebase.json                        # Firebase Hosting configuration with SPA rewrites
├── render.yaml                          # Render.com Web Service Blueprint CI/CD
├── src/
│   ├── components/
│   │   ├── DesktopSidebar.tsx           # Executive desktop navigation sidebar & shortcuts
│   │   ├── DashboardScreen.tsx          # Executive dashboard metrics, charts, and quick actions
│   │   ├── LiveMarketTicker.tsx         # Real-time ticking header with micro-flash animations
│   │   ├── AiWealthCopilot.tsx          # Floating conversational AI copilot
│   │   ├── BottomTabBar.tsx             # Mobile bottom navigation bar
│   │   ├── SyncBadge.tsx                # Real-time network & sync status badge (SYNCING/OFFLINE/ERROR/SYNCED)
│   │   ├── charts/
│   │   │   ├── HoldingsTreemap.tsx      # Interactive portfolio allocation treemap
│   │   │   ├── PerformanceChart.tsx     # Historical portfolio trajectory chart
│   │   │   └── Sparkline.tsx            # SVG micro-trend lines
│   │   └── modals/
│   │       ├── LiveMarketDepthModal.tsx # Level 2 Orderbook Depth Terminal
│   │       ├── MonteCarloModal.tsx      # 1,000-run statistical simulation studio
│   │       ├── StatementImportModal.tsx # 1-Click CSV/Statement parser
│   │       ├── ClientPortalModal.tsx    # Shareable client investor portal
│   │       ├── RebalanceModal.tsx       # Institutional portfolio rebalancing
│   │       └── StressTestModal.tsx      # 2008 Crash, Tech Bubble & Rate Hike stress testing
│   ├── screens/
│   │   ├── ClientsScreen.tsx            # Search, filter, client dossier & report studio
│   │   ├── PortfoliosScreen.tsx         # Unified portfolio analytics & live market feed
│   │   ├── ToolsScreen.tsx              # SIP, Cash Flow, Retirement, Goal Center & Vault
│   │   ├── WorkspaceScreen.tsx          # AI research brief, market message & aggregations
│   │   ├── SettingsScreen.tsx           # Security, theme, cloud sync, and subscriptions
│   │   └── PaywallScreen.tsx            # RevenueCat Pro Advisor Paywall UI
│   ├── services/
│   │   ├── network.ts                   # Real-time browser online/offline status detection & subscription
│   │   ├── realTimeMarket.ts            # Stochastic Brownian market tick & depth engine
│   │   ├── monteCarlo.ts                # Statistical path generation engine
│   │   ├── statementParser.ts           # CSV/statement parsing & classification
│   │   ├── revenueCat.ts                # RevenueCat SDK initialization & entitlements
│   │   ├── secureSync.ts                # AES-256 cryptographic sync client
│   │   ├── pdfReport.ts                 # Executive PDF report generation
│   │   ├── calculators.ts               # Pure financial models (SIP, Cash Flow, Goals)
│   │   └── aiAdvisor.ts                 # Gemini AI portfolio analyzer
│   └── theme/
│       └── colors.ts                    # Obsidian & Champagne Gold + Swiss Luxury Light palettes
├── backend/                             # Node.js + Express + MongoDB Atlas cloud API
│   ├── server.js                        # REST API with production token & CORS security enforcement
│   ├── Dockerfile                       # Multi-stage production container
│   └── package.json                     # Backend dependencies
└── __tests__/                           # 48 passing Jest unit test suites (262 total tests)
```

---

## 🚀 Getting Started

### 1. Run the Mobile & Web App Locally
```bash
# Clone repository
git clone https://github.com/SakshamJ01/AssetArray.git
cd AssetArray

# Install dependencies
npm install

# Start local web development server
npm run web

# Or start universal Expo bundler (iOS / Android / Web)
npm start
```

### 2. Build and Deploy Web App to Firebase Hosting
```bash
# Production deployment
npm run deploy:web

# Or deploy to an ephemeral preview channel
npm run deploy:preview
```

### 3. Run Automated Regression Tests
```bash
# Run full Jest test suite (48 suites, 262 tests)
npm test

# Run TypeScript typecheck
npm run typecheck

# Run production web build
npm run build:web

# Verify backend server syntax
node --check backend/server.js
```

---

## 💳 RevenueCat Monetization Setup

The app is pre-configured with RevenueCat's Test Store key for instant sandbox testing:
- **Test Key:** Pre-configured in `src/services/revenueCat.ts`.
- **Entitlement ID:** `pro_advisor`.
- **Testing Flow:** Open the app ➔ Go to **Clients** ➔ Tap **Export PDF Report** ➔ Experience the **Paywall** ➔ Tap **Subscribe** to unlock Pro features.
- **Sandbox Reset:** Navigate to **Settings** ➔ **Subscription (RevenueCat)** ➔ **Reset to Free Plan**.

---

## 🏆 Shipathon 2026 Submission

Asset Array is submitted for **Shipathon 2026 (Student Track)**:
- **Track:** Student Track
- **Monetization Engine:** RevenueCat (`react-native-purchases`)
- **Offerings:** Pro Advisor Monthly & Annual Subscriptions
- **Core Innovation:** Real-time share market streaming engine, Level-2 depth terminal, Monte Carlo wealth simulation, enterprise zero-knowledge client encryption, and Gemini-powered wealth co-pilot.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
