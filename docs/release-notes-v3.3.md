# Release Notes: AssetArray V3.3 — Advisor Command Center

## Release Summary
- **Release Version**: `3.3.0`
- **Release Title**: Intelligent Advisor Operating System Upgrade
- **Previous Release**: `3.2.0` (Institutional Quant Audit & Hardening)
- **Baseline Git Commit**: `c34c713`

---

## What's New in V3.3

### 1. Advisor Command Center
- **Executive Horizon Overview**: Answers WHO needs attention, WHAT changed, WHY it changed, WHAT to do next, and HOW to communicate.
- **Horizon Perspective Switcher**: Switch effortlessly between `TODAY`, `THIS WEEK`, and `THIS MONTH`.
- **4-Part Executive Breakdown**: Real-time counts for Critical Breaches, High-Priority Mandates, Reviews Due, and Active Opportunities.

### 2. Transparent Prioritization Engine (`src/services/advisor/prioritization.ts`)
- Deterministic 5-factor scoring model ($0-100$ scale):
  - Severity (30%)
  - Financial Impact (25%)
  - Urgency (20%)
  - Client Importance (15%)
  - Data Confidence (10%)
- Fully inspectable factor breakdown visible on every action card under "Why This Matters".

### 3. Action Orchestration & Canonical Deduplication (`src/services/advisor/actionEngine.ts`)
- Composite key deduplication: `clientId:sourceType:sourceId:actionType` prevents duplicate alert cards.
- Fiduciary lifecycle transitions: `OPEN` -> `IN_PROGRESS` -> `WAITING` -> `DONE` / `CANCELLED` / `SNOOZED`.
- 1-click deep links directing advisors immediately to the exact portfolio, risk, goal, or tax screen.

### 4. Client 360 Workspace (`src/features/advisor/Client360Modal.tsx`)
- Instant holistic snapshot of AUM, composite health score, goals progress, risk drawdown, and tax shields.
- Integrated fiduciary activity timeline and recommended next steps.

### 5. Fiduciary Decision Journal (`src/services/advisor/decisionJournal.ts`)
- Auditable ledger capturing Date, Client, Issue, Quantitative Evidence, Decision, Rationale, and Follow-up dates.
- Automatic dispatch to client activity timeline upon decision recording.

### 6. Grounded AI Advisor Brief (`src/services/advisor/dailyBrief.ts`)
- Synthesizes operational desk briefing strictly from deterministic metrics.
- Enforces numerical grounding where every number maps to a verified `{ sourceMetric, value, unit, asOf }`.

### 7. Opportunity Center & Data Quality Center
- Segregates positive wealth opportunities (tax harvesting, rebalancing drift, goal catch-up, idle cash drag) from portfolio risks.
- Data Quality Hygiene audit calculating portfolio completeness %, tax lot acquisition date coverage %, and actionable missing input tasks.

### 8. Keyboard-Accessible Command Palette (`Ctrl+K`)
- Fast global search across clients, portfolios, and actions on desktop/web, with mobile quick-action bar.

### 9. Backend Advisor API Endpoints (`backend/server.js`)
- Authenticated, tenant-isolated routes for tasks, activity, decisions, and briefs with server-side ownership enforcement.

---

## Verification & Test Suite
- Total Test Suites: **30 passed, 30 total**
- Total Tests: **138 passed, 138 total**
- TypeScript Typecheck: **Zero errors (`tsc --noEmit`)**
- Web Production Bundle: **Passed (`expo export -p web`)**
- Node Syntax Check: **Passed (`node --check backend/server.js`)**
