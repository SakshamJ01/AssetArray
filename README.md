# Asset Array 💼📈

[![CI Pipeline](https://github.com/SakshamJ01/AssetArray/actions/workflows/ci.yml/badge.svg)](https://github.com/SakshamJ01/AssetArray/actions)
[![RevenueCat](https://img.shields.io/badge/Monetization-RevenueCat-orange.svg)](https://www.revenuecat.com/)
[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo%20%2F%20React%20Native-blue.svg)](https://expo.dev/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)](https://ai.google.dev/)

**Asset Array** is an executive wealth management CRM, portfolio analyzer, and client reporting suite tailored for independent financial advisors, wealth managers, and family offices.

Built with a high-contrast executive dark aesthetic, client-side zero-knowledge encryption, and a built-in subscription paywall powered by **RevenueCat** for **Shipathon 2026**.

---

## 🌟 Key Features

### 💎 Pro Advisor Monetization (RevenueCat)
- **Native In-App Purchases:** Integrated via `react-native-purchases` supporting iOS App Store, Google Play, and RevenueCat Test Store sandbox.
- **Conversion-Optimized Paywall:** High-converting modal UI highlighting Pro benefits (Monthly & Annual pricing plans).
- **Feature Gating:** Free tier vs. Pro tier access control gating AI Portfolio Co-Pilot and Unlimited Client PDF Exports.
- **In-App Subscription Management:** Real-time plan status indicator, purchase restore, and a built-in sandbox reset toggle in Settings.

### 🤖 AI Portfolio Co-Pilot (Google Gemini)
- **Intelligent Rebalancing Briefs:** Generates institutional-grade asset allocation insights and risk commentary based on client holdings and risk profile.
- **Client Communication Drafts:** Creates personalized, professional updates ready to send via WhatsApp, Email, or SMS.

### 📄 Executive PDF Report Studio
- **Print & Share Ready:** Generates high-resolution, branded PDF portfolio summary reports on-device using `expo-print` and `expo-sharing`.
- **Advisor Branding:** Automatically stamps advisor credentials, disclaimers, asset breakdowns, and contact information.

### 📊 Comprehensive Financial Calculators
- **Stateless Calculation Engine:** Pure financial models for SIP, Cash Flow (payout & cumulative), Retirement, and Goal Planning (`src/services/calculators.ts`).
- **Interactive Projections:** Instant visual feedback on returns, inflation impact, and target maturity dates.

### 🔒 Enterprise Security & Local-First Sync
- **Hardware PIN & Biometrics:** Local authentication with Face ID / Touch ID via `expo-local-authentication` and `expo-secure-store`.
- **Zero-Knowledge Encryption:** End-to-end AES-256 encrypted synchronization with the Node.js/MongoDB backend.
- **Live Market Data:** Real-time quote streaming for top equities and indices.

---

## 🏗️ Architecture & Stack

```
AssetArray/
├── App.tsx                    # Main navigation, state orchestration, and views
├── src/
│   ├── screens/
│   │   └── PaywallScreen.tsx  # RevenueCat Pro Advisor Paywall UI
│   ├── services/
│   │   ├── revenueCat.ts      # RevenueCat SDK initialization, offerings & purchases
│   │   ├── pdfReport.ts       # Executive PDF report generation
│   │   ├── calculators.ts     # Pure financial math models (SIP, Cash Flow, Goals)
│   │   ├── aiAdvisor.ts       # AI portfolio rebalancing integration
│   │   ├── secureSync.ts      # AES-256 sync client & auth tokens
│   │   └── marketData.ts      # Live market quote fetcher
│   └── theme/
│       └── colors.ts          # Executive dark/gold palette tokens
├── __tests__/                 # Jest test suites (calculators & PDF transformation)
├── .github/workflows/ci.yml   # Automated GitHub Actions test & typecheck pipeline
└── backend/                   # Node.js + Express + MongoDB secure sync API
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo Go or an iOS/Android Simulator

### 2. Run the Mobile App
```bash
# Clone the repository
git clone https://github.com/SakshamJ01/AssetArray.git
cd AssetArray

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

### 3. Run Automated Tests
```bash
# Run Jest unit test suite
npm test

# Run TypeScript type verification
npx tsc --noEmit
```

### 4. Run the Encrypted Backend (Optional)
```bash
cd backend
npm install
npm start
```
The sync server runs on `http://localhost:4000`.

---

## 💳 RevenueCat Configuration

The app is pre-configured with RevenueCat's Test Store key for instant sandbox testing:
- **Test Key:** Pre-configured in `src/services/revenueCat.ts`.
- **Entitlement ID:** `pro_advisor`.
- **Testing Flow:** Open the app ➔ Go to **Clients** ➔ Tap **Export PDF Report** ➔ Experience the **Paywall** ➔ Tap **Subscribe** to unlock Pro features!

To switch back to the Free plan during testing, navigate to **Settings** ➔ **Subscription (RevenueCat)** ➔ **Reset to Free Plan**.

---

## 🏆 Shipathon 2026 Submission

Asset Array is submitted for **Shipathon 2026 (Student Track)**:
- **Track:** Student Track
- **Monetization Engine:** RevenueCat (`react-native-purchases`)
- **Key Offerings:** Pro Advisor Monthly & Annual Subscriptions
- **Core Innovation:** Gating Gemini-powered AI wealth co-pilot and automated client PDF reporting behind subscription entitlements.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
