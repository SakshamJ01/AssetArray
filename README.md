# Asset Array 💼📈

[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-asset--array.web.app-E0A84C?style=for-the-badge&logo=firebase&logoColor=white)](https://asset-array.web.app)
[![Live Backend API](https://img.shields.io/badge/API-assetarray.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://assetarray.onrender.com/api/health)
[![Cloud Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://cloud.mongodb.com)

[![CI Pipeline](https://github.com/SakshamJ01/AssetArray/actions/workflows/ci.yml/badge.svg)](https://github.com/SakshamJ01/AssetArray/actions)
[![RevenueCat](https://img.shields.io/badge/Monetization-RevenueCat-orange.svg)](https://www.revenuecat.com/)
[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo%20%2F%20React%20Native-blue.svg)](https://expo.dev/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)](https://ai.google.dev/)

**Asset Array** is an executive wealth management CRM, portfolio analyzer, and client reporting suite tailored for independent financial advisors, wealth managers, and family offices. 

Built with a high-contrast obsidian & champagne gold luxury aesthetic (`#030712` / `#E0A84C`), client-side zero-knowledge AES-256 encryption, multi-user cloud synchronization, responsive cross-platform web/desktop support, and built-in subscription monetization powered by **RevenueCat** for **Shipathon 2026**.

---

## 🌐 Live Production Deployments

| Tier | Provider | Live URL | Health / Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Firebase Hosting (Global CDN) | [asset-array.web.app](https://asset-array.web.app) | 🟢 Live Production SPA |
| **Backend API** | Render (Node.js Express) | [assetarray.onrender.com](https://assetarray.onrender.com) | 🟢 [Health Status Check](https://assetarray.onrender.com/api/health) |
| **Cloud Database** | MongoDB Atlas (Cloud Replica) | AWS Cloud Cluster | 🟢 Encrypted Storage Active |

---

## 🌟 Key Features

### 🖥️ Universal Desktop & Web Experience
- **Responsive Workspace:** Full-featured desktop layout (`≥1024px`) with an executive collapsible navigation sidebar, persistent key action bar, and responsive centered dialog modals.
- **Keyboard Power Shortcuts:** Quick navigation via `⌘K` (Client Finder), `⌘B` (Broadcast Center), `⌘L` (Desk Lock), and `Esc` (Dismiss Modals).
- **Mobile First Adaptation:** Automatically transforms into a bottom-sheet mobile app layout with bottom tabs and haptic feedback on smaller viewports.

### 💎 Pro Advisor Monetization (RevenueCat)
- **Native In-App Purchases:** Integrated via `react-native-purchases` supporting iOS App Store, Google Play, and RevenueCat Test Store sandbox.
- **Conversion-Optimized Paywall:** High-converting modal UI highlighting Pro benefits (Monthly & Annual pricing tiers).
- **Feature Gating:** Free tier vs. Pro tier access control gating AI Portfolio Co-Pilot and Unlimited Client PDF Exports.
- **In-App Subscription Management:** Real-time plan status indicator, purchase restore, and a built-in sandbox reset toggle in Settings.

### 🤖 AI Portfolio Co-Pilot (Google Gemini)
- **Intelligent Rebalancing Briefs:** Generates institutional-grade asset allocation insights and risk commentary based on client holdings and risk profile.
- **Client Communication Drafts:** Creates personalized, professional updates ready to dispatch via WhatsApp, Email, or SMS.

### 📄 Executive PDF Report Studio
- **Print & Share Ready:** Generates high-resolution, branded PDF portfolio summary reports on-device using `expo-print` and `expo-sharing`.
- **Advisor Branding:** Automatically stamps advisor credentials, disclaimers, asset breakdowns, and contact information.

### 📊 Comprehensive Financial Calculators
- **Stateless Calculation Engine:** Pure mathematical models for SIP, Cash Flow (payout & cumulative), Retirement, and Goal Planning (`src/services/calculators.ts`).
- **Interactive Projections:** Instant visual feedback on returns, inflation impact, and target maturity dates.

### 🔒 Enterprise Security & End-to-End Cloud Sync
- **Hardware PIN & Biometrics:** Local authentication with Face ID / Touch ID via `expo-local-authentication` and `expo-secure-store`.
- **Zero-Knowledge Encryption:** End-to-end AES-256 client encrypted synchronization with MongoDB Atlas.
- **Role-Based Cloud Auth:** Token-based JWT access and refresh rotation (`/api/auth/login`, `/api/auth/refresh`).

---

## 🏗️ Architecture & Platform Stack

```
AssetArray/
├── App.tsx                        # Root layout, navigation orchestration, and modal engine
├── firebase.json                  # Firebase Hosting configuration with SPA rewrites
├── render.yaml                    # Render.com Web Service Blueprint CI/CD
├── src/
│   ├── components/
│   │   ├── DesktopSidebar.tsx     # Executive desktop navigation sidebar & shortcuts
│   │   ├── DashboardScreen.tsx    # Executive dashboard metrics, charts, and quick actions
│   │   ├── BottomTabBar.tsx       # Mobile bottom navigation bar
│   │   └── SyncBadge.tsx          # Real-time E2EE cloud sync indicator
│   ├── screens/
│   │   ├── PaywallScreen.tsx      # RevenueCat Pro Advisor Paywall UI
│   │   └── workspace/             # Advisory messaging & client aggregation screens
│   ├── services/
│   │   ├── revenueCat.ts          # RevenueCat SDK initialization & entitlements
│   │   ├── secureSync.ts          # AES-256 cryptographic sync client
│   │   ├── pdfReport.ts           # Executive PDF report generation
│   │   ├── calculators.ts         # Pure financial models (SIP, Cash Flow, Goals)
│   │   ├── aiAdvisor.ts           # Gemini AI portfolio analyzer
│   │   └── marketData.ts          # Real-time market streaming feed
│   └── theme/
│       └── colors.ts              # Executive obsidian & champagne gold palette
├── backend/                       # Node.js + Express + MongoDB Atlas cloud API
│   ├── server.js                  # REST API (Auth, E2EE Sync, AI Research, Audit Logs)
│   ├── Dockerfile                 # Multi-stage production container
│   └── package.json               # Backend dependencies
└── __tests__/                     # Jest unit test suites
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

### 3. Deploy Backend API
The backend is configured for continuous deployment on [Render.com](https://render.com) using the included `render.yaml` blueprint. Simply connect the repository to Render, configure your environment variables (`MONGO_URI`, `GEMINI_API_KEY`, etc.), and deployment runs automatically on push to `main`.

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
- **Core Innovation:** Enterprise zero-knowledge client encryption, Gemini-powered wealth co-pilot, and institutional PDF reporting gated behind RevenueCat entitlements.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
