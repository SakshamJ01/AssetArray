# AssetArray — Flagship Screen Before / After Transformation
**Release Family**: 3.3.x  
**Transformation Focus**: From Generic Multi-Feature App $\longrightarrow$ Professional Financial Workstation

---

## 1. Dashboard (`src/components/DashboardScreen.tsx`)

- **BEFORE**:
  - Oversized floating hero card with triple nested cards (`featuredCard` $\rightarrow$ `heroAumBox` $\rightarrow$ `metricCard`).
  - Rounded corners of 16px to 24px with heavy shadows creating a "bubbly" SaaS dashboard feel.
  - Metrics and descriptive labels shared equal weight, forcing the eye to jump randomly.
  - Numbers used proportional fonts causing jitter and misaligned decimal columns.
- **AFTER**:
  - Integrated, calm Private Client Advisory summary bar with 8px canonical radius and subtle 1px border.
  - Card-in-card nesting completely eliminated; metrics flattened into clean tabular KPI cells.
  - Assets Under Advisory (AUM) displayed in high-contrast 32px tabular numerals (`fontVariant: ['tabular-nums']`) visually dominating uppercase labels.
  - Alert banners prioritized at the top: Overdue reviews (Red) and Tax/Rebalance deadlines (Amber).
- **WHY**:
  - Financial advisors require immediate scan density and numerical clarity. Tabular numerals and minimal elevation establish private-bank discipline and eliminate decorative fatigue.

---

## 2. Command Center (`src/features/advisor/AdvisorCommandCenter.tsx`)

- **BEFORE**:
  - Long unprioritized task list with ambiguous "View" buttons that had inconsistent navigation behaviors.
  - KPIs scattered across multiple unorganized rows.
  - Search required navigating back to the primary menu.
- **AFTER**:
  - Organized around the primary question: *"What needs my attention today?"*
  - First layer: Critical Today (Urgent mandates), Opportunities (Tax-loss & Rebalance), Upcoming (Follow-ups).
  - Explicit actionable verbs: `[Review Portfolio]`, `[Open Tax Studio]`, `[Rebalance]`, `[Snooze 24h]`.
  - Global `Ctrl+K` Command Palette integration for instant keyboard navigation.
- **WHY**:
  - Advisors handle dozens of clients simultaneously. Work queues must be triage-oriented with unambiguous action routing.

---

## 3. Client Roster (`src/screens/ClientsScreen.tsx`)

- **BEFORE**:
  - Wide pill filters taking up vertical screen height.
  - Low information density per row; hard to scan across 50+ clients.
  - Client names and details rendered in soft low-contrast gray.
- **AFTER**:
  - High-density scanning list with client avatar, name, category, priority, preferred contact channel, and formatted due date.
  - Immediate real-time search filtering across name, email, phone, city, and risk profile.
  - Prominent bulk update and campaign action bar for institutional communication.
- **WHY**:
  - Client rosters are workbenches for relationship managers. Dense rows with clear typography accelerate scanning and reduce scroll fatigue.

---

## 4. Client 360 Workspace (`src/components/client360/Client360Workspace.tsx`)

- **BEFORE**:
  - Generic client details card followed by separate detached cards for holdings, health, and risk.
  - Financial metrics were tucked away inside sub-tabs.
  - Missing persistent context banner when navigating across views.
- **AFTER**:
  - Institutional Client Header: Client Avatar, Name, HNI/Family Office badge, Priority indicator, Contact meta, and Risk mandate.
  - Consolidated KPI strip: Current Value, Overall Return %, Invested Capital, and Unrealized P&L in tabular numerals.
  - Action Toolbar: Instant single-click access to `Edit Profile`, `Import Statement`, `Client Portal`, `Export PDF`, and `Delete`.
  - Seamless two-column desktop workstation layout with integrated Diagnostic Health score and Monte Carlo Goal tracking.
- **WHY**:
  - Client 360 is the flagship screen of wealth advisory. It answers *"Who is this? What do they own? How is it performing? What needs action?"* in under 5 seconds.

---

## 5. Holdings Workstation (`src/components/client360/Client360Workspace.tsx` Table)

- **BEFORE**:
  - Card-based position blocks or squished mobile tables causing clipped numbers and truncated ticker symbols.
  - Missing drift against target allocation.
- **AFTER**:
  - Table-first financial layout: `ASSET`, `QTY`, `PRICE`, `VALUE`, `WEIGHT`, `P&L`, `DRIFT`.
  - Strict right-alignment of numerical values with tabular numerals and currency formatting.
  - Drift column color-coded (Amber $> 3\%$ drift, Neutral for in-band).
  - Responsive horizontal `ScrollView` with guaranteed $0\text{px}$ page overflow on mobile devices.
- **WHY**:
  - Mimics mature institutional trading and wealth platforms (Zerodha Kite, Nuvama, Bloomberg). Advisors must see quantities, prices, weights, and drifts side-by-side.

---

## 6. Portfolio Analytics (`src/screens/PortfoliosScreen.tsx`)

- **BEFORE**:
  - Heavy cards with decorative charts that lacked clear business questions.
  - Underperforming and top-performing assets were separated across disconnected pages.
- **AFTER**:
  - Unified view featuring:
    1. Multi-asset consolidated return trajectory.
    2. Treemap heatmap showing asset concentration.
    3. Asset allocation breakdown with percentage fill bars.
    4. Top performers vs. Underperformers with inline sparkline trends.
- **WHY**:
  - Every chart must answer an actionable portfolio question (e.g., *"Where is my capital concentrated? Which positions are dragging alpha?"*).

---

## 7. Institutional Risk (`src/components/HealthScoreCard.tsx` & Risk Engines)

- **BEFORE**:
  - Abstract risk numbers without transparent drivers or methodology.
- **AFTER**:
  - Comprehensive Health Score (0–100) decomposed into four clear fiduciary pillars:
    - *Diversification Score* (Asset class and single-stock concentration)
    - *Momentum Score* (Benchmark alpha vs. Nifty 50/BSE 500)
    - *Quality Score* (Credit rating of debt holdings & debt-to-equity ratios)
    - *Cost & Drift Score* (TER expense ratios and target drift)
  - One-click deep link to full Brinson-Fachler attribution.
- **WHY**:
  - Transparency builds client trust. Advisors can explain exactly *why* a portfolio health score changed.

---

## 8. Tax Optimization & Harvesting (`src/components/TaxHarvestStudioModal.tsx`)

- **BEFORE**:
  - Static tax estimates without lot-level verification.
- **AFTER**:
  - Indian Income Tax Section 70/74 compliant tax harvesting studio.
  - Segregated Short-Term Capital Gains ($20\%$ STCG) and Long-Term Capital Gains ($12.5\%$ LTCG after ₹1.25L exemption).
  - Identification of specific tax-loss harvesting candidates with estimated net tax savings.
- **WHY**:
  - Tax optimization is a primary fiduciary value driver. The advisor can demonstrate tangible rupee savings directly to clients.

---

## 9. Goal Planning & Monte Carlo (`src/components/modals/GoalModals.tsx`)

- **BEFORE**:
  - Plain progress bars without probabilistic forecasting.
- **AFTER**:
  - Goal cards showing Target, Current, Shortfall Gap, Target Date, and Probability of Success.
  - 1,000-iteration Monte Carlo engine displaying $P_{10}, P_{50}, P_{90}$ wealth paths without freezing UI threads.
- **WHY**:
  - Financial goals are probabilistic. Advisors need defensible stochastic ranges rather than naive linear compounding projections.

---

## 10. AI Market Research (`src/screens/AiResearchScreen.tsx`)

- **BEFORE**:
  - Generic text prompt producing an unverified AI paragraph with citation badges.
- **AFTER**:
  - Disciplined 4-stage pipeline: Search $\rightarrow$ Sources $\rightarrow$ Answer $\rightarrow$ Evidence.
  - Clear disclosure of data provenance: `✓ VERIFIED WEB RESEARCH` vs. `ℹ️ RESEARCH SOURCES DISCLOSURE`.
  - Itemized opportunities, risks, and short/long-term outlooks.
- **WHY**:
  - Professional advisors cannot rely on black-box conversational AI. Evidence must be cited, dated, and source-attributed.

---

## 11. AI Wealth Copilot (`src/components/AiWealthCopilot.tsx`)

- **BEFORE**:
  - Generic floating chat window with no visible client context.
- **AFTER**:
  - Institutional Private Banking Copilot with persistent context strip:
    `Using: [Client Name] · [Mandate] · As of [Date]`
  - Explicit streaming lifecycle indicator: `Connecting…` $\rightarrow$ `Thinking…` $\rightarrow$ `Generating…` $\rightarrow$ `Complete`.
  - Zero-hallucination error states with guaranteed access to deterministic financial metrics.
- **WHY**:
  - Contextual awareness and lifecycle transparency convert the AI from an ungrounded chat assistant into a certified co-pilot.

---

## 12. Wealth Statements & Reports (`src/services/pdfReport.ts`)

- **BEFORE**:
  - Unstyled plain PDF printout with generic tables.
- **AFTER**:
  - Institutional Private Wealth Statement layout:
    - Executive mandate summary & advisor credentials.
    - Verified holdings table with cost bases and market valuations.
    - Asset allocation pie breakdown and risk disclosures.
    - Regulatory disclosures and client signature sign-off.
- **WHY**:
  - Formal client reporting is the primary tangible artifact delivered by an advisory firm. Statements must reflect private-bank excellence.
