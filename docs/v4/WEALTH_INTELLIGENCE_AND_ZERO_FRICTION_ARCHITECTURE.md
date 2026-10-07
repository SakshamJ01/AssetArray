# AssetArray: Wealth Intelligence & Zero-Friction Architecture

## Overview
This architectural dossier details the design, engineering principles, and operational mechanics of the **4 Next-Gen Wealth Intelligence Breakthrough Pillars**, the **Zero-Friction Executive Quick-Launch Dock**, and the **Institutional Multi-Theme Engine** deployed in AssetArray.

---

## 1. The 4 Wealth Intelligence Breakthrough Pillars

Conventional wealth platforms treat wealth strictly as Demat equities and listed mutual funds, ignoring unlisted physical assets, family transmission friction, hidden composite stock overlap, and behavioral panic selling. AssetArray addresses all four:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ASSETARRAY WEALTH INTELLIGENCE SUITE                           │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 1. FAMILY CONTINUITY     │ 2. FUND X-RAY & OVERLAP  │ 3. INVESTMENT CONSTITUTION       │
│    • Nominee Health Audit│    • True Stock Unpack   │    • Anti-Impulse Guardrails     │
│    • Emergency Playbook  │    • Overlap Score Matrix│    • Historical Drawdown Sims    │
│    • Transmission Hotline│    • Fee Drag Eliminator │    • 24h Cooling-Off Gate        │
├──────────────────────────┴──────────────────────────┴──────────────────────────────────┤
│ 4. SHADOW WEALTH & PHYSICAL ASSETS                                                     │
│    • Physical Gold Locker Revaluation (Spot Bullion Multipliers)                       │
│    • Real Estate Deeds, Circle Rates & Rental Yield Ledger                             │
│    • Private Promissory Notes & Accrued Interest Engines                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Pillar I: 🛡️ Family Continuity Vault & Nominee Audit
- **Service**: `src/services/intelligence/familyVaultService.ts`
- **Component**: `src/components/modals/FamilyVaultModal.tsx`
- **Core Problem Solved**: Over 80% of middle-class and high-net-worth families in India face frozen assets, delayed probate, and legal transmission hurdles when key asset holders face emergencies because mutual fund folios, bank accounts, or demat holdings lack verified registered nominees.
- **Key Capabilities**:
  1. **Nominee Completeness Audit**: Scans all portfolio holdings across depositories (CDSL/NSDL), registrars (CAMS/KFintech), and banks, grading nominee completeness as a percentage health score.
  2. **1-Click Encrypted Family Continuity Playbook**: Compiles an emergency handover dossier detailing exact folio numbers, custodian contact centers, registered nominees, and emergency contact details.
  3. **Multi-Client Switching**: Allows advisors to switch between client accounts directly in the modal header.
  4. **Client-Scoped Persistence**: Stores custom nominee designations in `AsyncStorage` (`ASSETARRAY_VAULT_<clientId>`).

### Pillar II: 🔍 Look-Through Fund X-Ray & Overlap Matrix
- **Service**: `src/services/intelligence/fundXrayService.ts`
- **Component**: `src/components/modals/FundXrayModal.tsx`
- **Core Problem Solved**: Investors and advisors frequently hold 5–8 active mutual funds believing they are diversified, when in reality 60–75% of capital is concentrated into the same top 10 stocks (e.g. HDFC Bank, Reliance, ICICI Bank, TCS) while paying redundant expense ratios (1.5%–2.0% p.a.).
- **Key Capabilities**:
  1. **Look-Through Deconstruction**: Unpacks fund constituents to expose true aggregated single-stock exposure across funds.
  2. **Overlap Scoring**: Computes a 0–100% overlap score along with estimated annual fee drag.
  3. **1-Click Consolidation Rebalance**: Stages rebalancing proposals to swap redundant funds into low-cost index ETFs.
  4. **Multi-Client Recalculation**: Dynamically processes multi-client portfolios.

### Pillar III: ⚖️ Anti-Impulse Investment Constitution
- **Service**: `src/services/intelligence/constitutionService.ts`
- **Component**: `src/components/modals/ConstitutionModal.tsx`
- **Core Problem Solved**: Emotional trading during market corrections or FOMO runs violates the client's long-term Investment Policy Statement (IPS). 91% of panic sellers lock in bottom-tick losses.
- **Key Capabilities**:
  1. **Mandate Boundary Rules**: Enforces limits on single-stock concentration (≤15%), liquid cash buffers (≥5%), and max equity drift (≤80%).
  2. **Historical Crisis Simulator**: Simulates real drawdowns and recovery curves across historical crises:
     - 2008 Global Financial Crisis (-52% market drop, 24-month recovery)
     - 2020 COVID-19 Flash Crash (-38% market drop, 7-month recovery)
     - 2000 Dot-Com Bubble (-45% market drop, 36-month recovery)
  3. **Anti-Impulse Pre-Trade Gate**: Allows testing orders prior to execution; panic liquidations activate a simulated **24-Hour Behavioral Cooling-Off Gate** countdown and dual-signatory mandate.

### Pillar IV: 🪙 Shadow Wealth & Physical Asset Desk
- **Service**: `src/services/intelligence/shadowWealthService.ts`
- **Component**: `src/components/modals/ShadowWealthModal.tsx`
- **Core Problem Solved**: Real family wealth in India and Asian markets is heavily tied up in physical gold bullion, ancestral real estate, and unlisted private debt notes—none of which are captured by standard brokerage APIs.
- **Key Capabilities**:
  1. **Physical Gold Bullion Desk**: Evaluates gold bars, coins, and jewelry using live spot bullion rates (24K, 22K, 18K purity factors) with safe deposit locker tracking.
  2. **Real Estate Desk**: Tracks commercial and residential deeds, circle rates, square footage, and annual rental yields.
  3. **Private Promissory Debt Notes**: Calculates daily accrued interest across Simple, Compounded Annually, and Compounded Quarterly notes.
  4. **Full CRUD & Local Persistence**: Users and advisors can add new assets directly via modal forms, persisted client-by-client in `AsyncStorage` (`ASSETARRAY_SHADOW_<clientId>`).

---

## 2. Zero-Friction 1-Click Executive Workstation Launchpad

- **Component**: `src/components/dashboard/ExecutiveLaunchpad.tsx`
- **Integration**: Mounted prominently in `src/features/advisor/AdvisorCommandCenter.tsx`
- **Philosophy**: Eliminates the "100 clicks" problem. Every mission-critical workstation tool is directly accessible from the Executive Dashboard header with a single tap:
  1. 🌾 **Tax Harvest Studio** (`TaxHarvestStudioModal`)
  2. ⚖️ **Portfolio Rebalancing Desk** (`RebalanceModal`)
  3. 📉 **Historical Crisis Stress Test** (`StressTestModal`)
  4. 🎲 **Monte Carlo Wealth Sim** (`MonteCarloModal`)
  5. 🔮 **What-If Scenario Sandbox** (`ScenarioSandboxModal`)
  6. 🛡️ **Family Continuity Vault** (`FamilyVaultModal`)
  7. 🔍 **Fund X-Ray & Overlap** (`FundXrayModal`)
  8. 📜 **Investment Constitution** (`ConstitutionModal`)
  9. 🪙 **Shadow Wealth Desk** (`ShadowWealthModal`)
  10. 🤖 **AI Wealth Copilot** (Floating drawer)
  11. 📣 **Client Outreach Broadcast** (Direct modal)

---

## 3. Institutional Multi-Theme Engine

Advisors can customize the visual environment across three institutional-grade palettes:

1. **Executive Gold (Private Bank & Family Office)**:
   - Surface: `#030712` (Obsidian Dark)
   - Accent: `#E0A84C` (Radiant Champagne Gold)
   - Mood: Ultra-premium high-net-worth advisory.
2. **Terminal Aladdin (Hedge Fund & Quant Workstation)**:
   - Surface: `#060A12` (Cyber Slate)
   - Accent: `#00E5A3` (Electric Emerald) & `#38BDF8` (Cyan Alpha)
   - Mood: Bloomberg/Aladdin high-density institutional trading desk.
3. **Swiss Ivory (Classic Daylight Private Wealth)**:
   - Surface: `#F8F9FA` (Swiss Daylight Ivory)
   - Accent: `#B37E28` (Antique Gold) & `#1E293B` (Navy Slate)
   - Mood: Daylight clarity for formal client presentations.

Theme selection is togglable via:
- 1-Click **Theme Switcher Pill** in the dashboard header.
- **Settings Screen** segmented theme selector chips.

---

## 4. Verification & Quality Invariants

- **TypeScript Compiler**: `tsc --noEmit` verifies **0 errors** across all strict contracts.
- **Design System Tokens**: Fully compliant with canonical radii tokens (`[0, 4, 8, 12, 999]`), verified by `__tests__/uxRegression.test.ts`.
- **Test Suite**: 95 of 96 suites passing (1 skipped), totaling 498 unit & integration tests passing with 0 failures.
- **Production Web Build**: Clean Metro web bundle exported to `dist/`.
- **Live Deployment**: Hosted on Firebase Hosting at `https://asset-array.web.app`.
