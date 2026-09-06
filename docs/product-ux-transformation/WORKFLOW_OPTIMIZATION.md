# AssetArray — Workflow Optimization & Friction Elimination
**Release Family**: 3.3.x  
**Target User**: Registered Investment Advisors, Wealth Managers, Family Office Mandates  
**Paradigm**: Institutional Advisor Workstation (Zerodha Kite clarity + Nuvama wealth discipline)

---

## 1. Executive Summary
AssetArray 3.3.x has been transformed from a large multi-feature application into an efficient, unified financial advisor workstation. Rather than exposing all analytical engines simultaneously (*"Everything Everywhere All At Once"*), workflows now adhere strictly to:
$$\text{CONTEXT} \longrightarrow \text{PRIORITY} \longrightarrow \text{ACTION} \longrightarrow \text{DETAIL}$$

This document outlines the measured click-depth optimizations, contextual state handoffs, progressive disclosure mechanics, and the meeting preparation workflow.

---

## 2. Interaction Depth Benchmarks (Click-Budget Auditing)

Targeted vs. Achieved Interaction Budgets (Rule 127):

| Core Advisor Journey | Interaction Budget | Achieved Steps | Direct Path / Shortcut |
| :--- | :--- | :--- | :--- |
| **Find Specific Client** | $\le 2$ interactions | **1 interaction** | Global Command Palette (`Ctrl+K` / Search bar immediate filter) |
| **Open Portfolio & Holdings** | $\le 2$ interactions | **2 interactions** | Clients list $\rightarrow$ Instant inline Client 360 view with preloaded ledger |
| **Review Institutional Risk** | $\le 2$ interactions | **1 interaction** | Command Center Critical Alert $\rightarrow$ Click `[Review Risk]` |
| **Inspect Tax-Loss Opportunity** | $\le 3$ interactions | **2 interactions** | Command Center $\rightarrow$ Tax Opportunities Tab $\rightarrow$ Click `[Open Tax Studio]` |
| **Run What-If Rebalance Scenario** | $\le 4$ interactions | **2 interactions** | Client 360 Drift alert $\rightarrow$ Click `[Rebalance]` (passes current allocation automatically) |
| **Generate Formal PDF Report** | $\le 3$ interactions | **2 interactions** | Client 360 Action Toolbar $\rightarrow$ Click `[Export PDF]` $\rightarrow$ Preview & Export |

*Zero dead-end navigation or circular routing detected.*

---

## 3. Contextual Cross-Engine Handoffs (Zero Repeated Input)

### 3.1. Client 360 $\longrightarrow$ Multi-Tab Deep Routing
Inside a selected client, every key metric or diagnostic directly links to its corresponding deep tool without requiring re-navigation or re-selection:
- **Drift Alert $\longrightarrow$ Rebalance Sandbox**: Target weights and current holding weights are transferred directly to `RebalanceModal.tsx`.
- **Health Diagnostic $\longrightarrow$ Attribution Studio**: Clicking the Health Score card instantly mounts `AttributionModal.tsx` seeded with active client holdings and benchmark allocations.
- **Tax Alert $\longrightarrow$ Tax Harvesting Studio**: Clicking an STCG/LTCG warning opens `TaxHarvestStudioModal.tsx` targeting the client's unrealized lots.
- **Goal Gap $\longrightarrow$ Scenario Sandbox**: Target shortfalls pass directly into `ScenarioSandboxModal.tsx` for Monte Carlo projection.

### 3.2. AI Wealth Copilot Contextual Injection
When invoking the Wealth Copilot from a client context:
- Persistent context strip displays: `Using: [Client Name] · [Risk Profile] · As of [Current Date]`.
- Prompts ("Explain concentration", "Why did risk increase?") automatically receive:
  - `clientName`, `totalAum`, `riskProfile`
  - Current active holdings array
  - Unrealized gains and tax classification
  - Recent portfolio event snapshots

### 3.3. AI Research $\longrightarrow$ Portfolio Cross-Link
From any holdings row (e.g., *Reliance Industries* or *TCS*):
- Triggering research automatically seeds `aiResearchQuery` with the security ticker/name.
- Source transparency engine discloses whether the retrieved report is verified web intelligence or model-only historical synthesis.

---

## 4. Progressive Disclosure Hierarchy

Workstation information is organized into three distinct tiers:
1. **Primary (Visible at First Glance, $< 500\text{ms}$ scan)**:
   - Total Assets Under Advisory (AUM) in tabular numerals.
   - Critical alerts work queue (Overdue reviews, drawdown breaches).
   - Core holdings table with asset, qty, price, value, weight, P&L, drift.
2. **Secondary (Contextual Drawer / Tab View, 1 click)**:
   - Asset allocation comparison (Target vs. Actual).
   - Health score component breakdown (Diversification, Momentum, Quality, Cost).
   - Goal timeline and probability distribution.
3. **Advanced (Progressive Disclosure Modal / Technical Drawer)**:
   - Brinson-Fachler multi-currency attribution decomposition (Allocation, Selection, Interaction).
   - Monte Carlo 1,000-iteration probability percentiles ($P_{10}, P_{50}, P_{90}$).
   - Granular tax lots under Section 70/74 verification rules.

---

## 5. Client Meeting Mode (Zero-Friction Presentation)

The workstation provides an integrated, non-destructive **Client Meeting Mode** that synthesizes the client's position without cluttering the screen with raw technical parameters:
- **Header**: Clean fiduciary banner with client name, mandate, and as-of valuation.
- **Executive Agenda**:
  1. *What Changed*: Performance since last milestone and market return.
  2. *Current Allocation*: Asset distribution across Equity, Debt, Gold, Cash.
  3. *Risk & Health*: 0-100 diagnostic score with clear positive/negative drivers.
  4. *Fiduciary Action Items*: Tax harvesting opportunities, drift rebalancing proposal.
- **Immediate Follow-Up**:
  - Advisor can export a branded PDF statement or generate a personalized WhatsApp/Email summary draft in a single tap.

---

## 6. Friction Elimination Log

| Previous UX Friction Point | Root Cause | Workstation Solution |
| :--- | :--- | :--- |
| Floating cards cluttered mobile view | Over-reliance on Dribbble-style card grids | Converted to section dividers and dense data tables |
| Ambiguous "View" buttons | Generic UI copy | Replaced with specific actions: `[Review Portfolio]`, `[Open Tax Studio]`, `[Rebalance]` |
| Numbers blurred into labels | Equal font weight and size | Implemented tabular numerals; metrics dominate labels by $> 2\times$ font scale |
| Advisor had to re-type client name in Copilot | Isolated chat state | Integrated persistent client context banner directly into copilot stream |
| Mobile table columns squeezed unreadably | Rigid grid on small viewports | Responsive horizontal scroll container with sticky priority metrics |
