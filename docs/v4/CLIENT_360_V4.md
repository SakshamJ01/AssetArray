# ASSETARRAY 4.0 — CLIENT 360 V4 SPECIFICATION
**Institutional Advisor Platform Product Blueprint**

---

## 1. Philosophy: Beyond the Giant Dashboard

Traditional wealth management dashboards dump 50 disconnected charts and tables on a single screen, forcing the advisor to mentally assemble context. 

AssetArray 4.0's Client 360 is an **Active Decision Surface** built around five fundamental human questions:
1. **"What changed?"** (Net worth delta, market swings, inflows/outflows since last review)
2. **"What matters?"** (Mandate drift, risk breaches, upcoming liquidity requirements)
3. **"What needs action?"** (Harvestable tax losses before March 31, underfunded goal SIPs, pending approvals)
4. **"What was decided?"** (History of agreed investment decisions and mandate waivers)
5. **"What happens next?"** (Assigned follow-up tasks, scheduled review date, drafted client communications)

---

## 2. Above-The-Fold Anatomy (The Advisor Cockpit)

```
+---------------------------------------------------------------------------------------------------+
| CLIENT IDENTITY & BANNER (Vikram Malhotra - HNI Household)               [Client-Safe Mode: OFF]  |
| Mandate: Moderate Growth (65% Eq / 30% Debt / 5% Gold) | Last Review: 12 Jan 2026 | Next: TODAY   |
+---------------------------------------------------------------------------------------------------+
| AUM CONSOLIDATED        YTD RETURNS (XIRR)       DRIFT STATUS             NEXT ACTION             |
| ₹ 18,52,40,000          +16.4%                   ALERT: Large Cap +8.2%   [Review Rebalance Plan] |
| (▲ ₹1.42 Cr / +8.3% MoM)| vs Nifty 50: +12.1%    Equity: 73.2% vs 65% tgt | Tax Harvest: ₹4.8L pot|
+---------------------------------------------------------------------------------------------------+
```

### Key Metrics Above the Fold
- **Consolidated Net Worth**: Exact market value across all linked family portfolios, cash, and liabilities with as-of timestamp.
- **True Portfolio Return**: Benchmark-relative XIRR (internal rate of return accounting for cash flows) and Time-Weighted Return (TWR).
- **Mandate Drift Flag**: Instant visual corridor indicator showing whether the portfolio is within the agreed tolerance bands (+/- 5%).
- **Primary Next Action**: Dynamic, deterministic prompt guiding the advisor to the highest-priority operational task.

---

## 3. Deep Domain Tabs

```
+---------------------------------------------------------------------------------------------------+
| [1. Overview] [2. Portfolios] [3. Holdings] [4. Risk] [5. Tax] [6. Goals] [7. Meeting] [8. Tasks] |
+---------------------------------------------------------------------------------------------------+
```

### Tab 1: Overview & Household Balance Sheet
- **Asset Allocation vs Target**: Interactive visual breakdown of Equity (Large, Mid, Small), Fixed Income (Sovereign, Corporate, Liquid), Alternatives (REITs, Gold), and Cash.
- **Household Member Cards**: Visual cards for Vikram (Personal), Anita (Spouse), Malhotra HUF, and V-Tech Holdings Pvt Ltd.
- **30-Day Activity Ledger**: Recent purchases, dividend credits, redemptions, and bank cash transfers.

### Tab 2: Portfolios & Custodian Accounts
- Granular account breakdown by broker/custodian (Zerodha Demat, ICICI Direct Demat, CAMS MF Folios, Kotak Bank Savings).
- Real-time reconciliation status badges (Green = Reconciled, Amber = Pending Contract Note).

### Tab 3: Holdings & Tax Lots
- Multi-asset table with instant filtering by asset class, sector, geography, and custodian.
- Expandable lot-level drill-down: Purchase Date, Quantity, Cost Basis, Current Price, Unrealized P&L, Holding Period, Tax Classification (STCG/LTCG).

### Tab 4: Risk, Factors & Stress Scenarios
- **Concentration Analysis**: Top 5 holdings (% of total AUM), single-sector exposure limits (e.g., Financial Services capped at 25%).
- **Downside Risk Metrics**: Value-at-Risk (VaR 95%), Expected Shortfall (CVaR), Beta to Nifty 50, Maximum Historical Drawdown.
- **Live Stress-Testing**: Projected portfolio loss in historical crash scenarios (2008 GFC, 2020 COVID shock, 2022 Fed Rate Hike) with asset-level vulnerability heatmaps.

### Tab 5: Tax Intelligence (India Sec 70/74)
- **Realized Capital Gains Summary**: YTD STCG (Taxable @ 20%) and LTCG (Taxable @ 12.5% above ₹1.25L exemption).
- **Active Tax Harvesting Opportunities**: Specific lot recommendations for loss harvesting to offset realized gains before March 31.
- **Carry-Forward Loss Tracker**: Historical 8-year loss ledger with statutory expiry dates.

### Tab 6: Goal Planning & Monte Carlo Feasibility
- **Active Goals**: Retirement (₹15 Cr in 2035), Child Education (₹1.5 Cr in 2027), Vacation Home (₹2.5 Cr in 2029).
- **Probability Gauges**: Deterministic cash-flow simulations displaying % probability of success.
- **Remediation Action Engine**: Recommends SIP adjustments if goal funding falls below 75%.

### Tab 7: Meeting Mode & Live Decision Workspace
- **Sanitized Presentation View**: Clean, high-contrast visual display designed for tablet or client screen-share.
- **Interactive Simulation Slider**: "What if we reallocate ₹50 Lakh from Equity to Fixed Income?"
- **Live Decision Capture**: Instant field to log agreed client actions and generate digitally signed follow-up packs.

### Tab 8: Tasks, Timeline & Communication Hub
- Integrated log of client emails, WhatsApp updates, formal review notes, and phone call memos.
- Back-office task assignment queue with due dates, priorities, and audit trails.

---

## 4. Contextual AI Copilot Integration in Client 360

The AI Copilot does not float as an aimless chat window. It is embedded contextually across Client 360 with pre-grounded prompt recipes:

```
+-------------------------------------------------------------------------------+
| CONTEXTUAL COPILOT RECIPES (Pre-bound to Vikram Malhotra's Live Portfolio)    |
+-------------------------------------------------------------------------------+
| [1. "Prepare 3-minute executive brief for today's meeting"]                   |
| [2. "Explain why large-cap equity drifted +8.2% this quarter"]                |
| [3. "Draft tax-loss harvesting recommendation email for client review"]        |
| [4. "Stress-test portfolio against a 15% midcap market correction"]           |
| [5. "Summarize last 3 meeting decisions and verify follow-up status"]         |
+-------------------------------------------------------------------------------+
```
