# ASSETARRAY 4.0 — REAL ADVISOR WORKFLOWS & DAY-IN-THE-LIFE MODEL
**Institutional Advisor Platform Product Blueprint**

---

## 1. The 18 Real Advisor Workflows

In AssetArray 4.0, every capability is anchored around a concrete Job-To-Be-Done (JTBD). The platform eliminates "dashboard browsing" and drives structured execution across 18 critical workflows.

```
+----------------------------------------------------------------------------------------------------+
| THE UNIVERSAL WORKFLOW ATOM                                                                         |
| TRIGGER -> CONTEXT -> INFORMATION -> DECISION -> ACTION -> FOLLOW-UP -> AUDIT TRAIL                |
+----------------------------------------------------------------------------------------------------+
```

---

### Workflow 1: Start-of-Day Advisor Review
- **Trigger**: Advisor logs in at 8:30 AM before market open.
- **Context**: Overnight global macro moves (US Fed rate hints, crude oil surge, SGX/GIFT Nifty delta).
- **Information**: Command Center displays prioritized exceptions: 3 client portfolios in concentration breach, 2 upcoming SIP renewal deadlines, 1 client meeting scheduled at 11:00 AM.
- **Decision**: Prioritize which client accounts need proactive contact vs which alerts are noise.
- **Action**: Click "Accept Agenda", flagging 2 rebalance reviews for afternoon and opening the 11:00 AM Client Meeting Brief.
- **Follow-Up**: Auto-generates morning task list.
- **Audit Trail**: `AdvisorSessionStarted`, `MorningBriefViewed`.

---

### Workflow 2: Client Meeting Preparation
- **Trigger**: 30 minutes prior to a scheduled client review.
- **Context**: Client Vikram Malhotra (HNI Household, ₹18.5 Cr AUM).
- **Information**: Client Meeting Mode workspace compiles: Net Worth trend, YTD XIRR (+16.4% vs Nifty 50 +12.1%), asset allocation drift (Equity at 74% vs 65% target mandate), goal progress (Daughter's Oxford Masters in 2027: On Track), and open tax loss harvesting opportunity (₹4.8 Lakh under Sec 70/74).
- **Decision**: Frame meeting narrative: Rebalance 9% from Large/Midcap into Short Duration Debt & Gold, utilizing available capital loss offsets.
- **Action**: One-click generate "Meeting Executive Brief" (1-page clean PDF & interactive tablet view).
- **Follow-Up**: Set agenda items in Client 360.
- **Audit Trail**: `MeetingPackGenerated`, `MeetingAgendaSaved`.

---

### Workflow 3: Client Meeting Execution
- **Trigger**: Meeting commences (in-person or screen-share).
- **Context**: Presenting to client Vikram & spouse.
- **Information**: Interactive "Client Presentation Mode" (sanitized view: hides back-office notes, compliance flags, internal fee margins; shows high-level household net worth, goal funding bars, and simulation slider).
- **Decision**: Client agrees to trim 5% of direct equity (Reliance & Tata Motors) and allocate ₹50 Lakh into Arbitrage Fund.
- **Action**: Log decision live into Meeting Workspace: "Client approved ₹50L equity trim to Arbitrage for tax efficiency."
- **Follow-Up**: System stages drafted rebalance order pack.
- **Audit Trail**: `ClientDecisionLogged`, `MeetingCompletedEvent`.

---

### Workflow 4: Post-Meeting Follow-Up
- **Trigger**: Meeting ends.
- **Context**: Meeting notes and captured decisions in state.
- **Information**: AI Copilot parses logged notes and generates:
  1. Professional client email summary with agreed action items.
  2. WhatsApp brief for quick mobile confirmation.
  3. Internal operations task for Sunita (Ops) to prepare execution slips.
- **Decision**: Advisor reviews generated drafts, makes a 1-sentence edit, and clicks "Approve & Send".
- **Action**: Email dispatched via firm SMTP, task assigned in Ops queue.
- **Follow-Up**: Auto-schedules calendar reminder for 7 days post-execution.
- **Audit Trail**: `ClientCommDispatched`, `OpsTaskAssigned`.

---

### Workflow 5: Portfolio Review & Drift Analysis
- **Trigger**: Scheduled monthly cycle or market volatility trigger (>3% weekly benchmark swing).
- **Context**: Multi-asset portfolio linked to "Moderate Growth" mandate.
- **Information**: Target vs Actual visual allocation matrix; sub-asset breakdown (Large/Mid/Small Cap, Sovereign/Corporate Debt, Sovereign Gold Bonds). Drift flagged: Large Cap Equity +8.2% above upper tolerance corridor.
- **Decision**: Evaluate whether to rebalance immediately or let winner run within buffer zone.
- **Action**: Initiate Rebalance Scenario in sandbox.
- **Follow-Up**: Record rationale if rebalance is deferred ("Permitted drift due to Q3 earnings momentum").
- **Audit Trail**: `DriftAnalysisRun`, `MandateWaiverRecorded`.

---

### Workflow 6: Tax-Aware Portfolio Rebalance
- **Trigger**: Approved asset allocation shift or annual rebalancing window.
- **Context**: Need to trim ₹35 Lakh from Equity to Debt.
- **Information**: Tax Lot Engine calculates exact tax liability across FIFO vs Specific Lots. Identifies lots with Short-Term Capital Loss (STCL) and Long-Term Capital Loss (LTCL) to offset realized STCG/LTCG.
- **Decision**: Select tax-optimized lot selection algorithm to minimize net tax outgo under Indian Budget rules.
- **Action**: Generate proposed rebalance transaction list with estimated post-tax savings (e.g., "Tax saved: ₹72,500").
- **Follow-Up**: Export execution file (NSE/BSE mutual fund switch format or broker order sheet).
- **Audit Trail**: `RebalanceOrderCalculated`, `TaxHarvestingLinked`.

---

### Workflow 7: Risk Review & Stress Testing
- **Trigger**: Macro shock (e.g., Geopolitical tension, crude spike, RBI rate hike).
- **Context**: High-equity HNI client accounts.
- **Information**: Risk Analytics engine presents VaR (95% & 99%), Conditional VaR (CVaR/Expected Shortfall), Maximum Historical Drawdown, and Beta. Stress-test simulator computes projected drawdown under 2008 GFC (-38%), 2020 COVID (-28%), and 2022 Tech Selloff (-18%).
- **Decision**: Determine if downside risk breaches client risk tolerance profile.
- **Action**: Draft risk mitigation memorandum suggesting partial hedging or sovereign debt allocation.
- **Follow-Up**: Push risk summary to client's upcoming quarterly review.
- **Audit Trail**: `StressTestExecuted`, `RiskMemoCreated`.

---

### Workflow 8: Tax Opportunity Review (India Sec 70/74)
- **Trigger**: Annual Q4 tax planning sweep (January to March 15).
- **Context**: Client realized ₹12 Lakh STCG from trading gains during FY.
- **Information**: Identification of unrealized loss positions in direct equities or equity mutual funds held < 12 months (STCL potential) and > 12 months (LTCL potential).
- **Decision**: Select specific loss-making holdings to sell before March 31 and re-invest in equivalent index/basket after cooling-off.
- **Action**: Generate "Tax-Loss Harvesting Plan" for client approval.
- **Follow-Up**: Schedule execution check before financial year close.
- **Audit Trail**: `TaxHarvestingPlanDrafted`, `Sec70AuditRecorded`.

---

### Workflow 9: Goal Health & Feasibility Review
- **Trigger**: Client deposits lump sum or requests goal horizon update.
- **Context**: Child's Foreign Education goal (₹1.2 Cr needed in 4 years).
- **Information**: Deterministic Monte Carlo & cash-flow projection calculates 62% probability of success at current SIP rate (₹1.2 Lakh/month).
- **Decision**: Identify remediations: Increase SIP by ₹25,000/month OR adjust target corpus by 10% OR extend asset allocation equity tilt.
- **Action**: Save updated Goal Strategy and generate client comparison graph.
- **Follow-Up**: Assign task: "Review SIP mandate mandate increase with client."
- **Audit Trail**: `GoalRecalibrated`, `GoalPlanUpdated`.

---

### Workflow 10: Investment Research & Due Diligence
- **Trigger**: Analyst evaluating a new PMS fund or Midcap stock for firm-wide model inclusion.
- **Context**: Security ticker: *TATAELXSI* or Mutual Fund *Parag Parikh Flexi Cap*.
- **Information**: Multi-source research engine pulls: SEC/MCA financials, Morningstar/AMFI fund metrics, quarterly earnings transcripts, historical rolling returns, capture ratios, and governance track record.
- **Decision**: Approve instrument for Firm Buy List with strict allocation cap (max 4% per client).
- **Action**: Publish internal Investment Committee Research Note with verified citations.
- **Follow-Up**: Tag instrument in central model portfolio library.
- **Audit Trail**: `ResearchNotePublished`, `SecurityApproved`.

---

### Workflow 11: Client Communication & Inquiry Response
- **Trigger**: Client sends WhatsApp message: "Should I exit my Small Cap fund? Markets look high."
- **Context**: Client portfolio has 12% in Nippon India Small Cap (mandate allows 10–15%).
- **Information**: Context-aware AI Copilot pulls client’s exact purchase dates, unrealized gain, remaining goal horizon (12 years), and historical 7-year rolling small-cap return data.
- **Decision**: Draft reassuring, evidence-based response explaining that the 12-year goal horizon makes short-term volatility beneficial for ongoing SIP accumulation.
- **Action**: Advisor reviews AI-drafted reply, adds a personal greeting, and copies to WhatsApp.
- **Follow-Up**: Log communication event in Client 360 Timeline.
- **Audit Trail**: `ClientMessageLogged`, `AICopilotDraftUtilized`.

---

### Workflow 12: Quarterly Review Pack Generation
- **Trigger**: End-of-quarter reporting cycle.
- **Context**: 120 client households requiring branded performance packs.
- **Information**: Automated batch reporting engine aggregates: Household Executive Summary, Portfolio Performance (TWR & XIRR), Asset Allocation vs Benchmark, Transactions, Capital Gains Summary, and Advisor Commentary.
- **Decision**: Batch review by Senior Advisor for any flagged performance anomalies.
- **Action**: One-click publish to Client Portal and dispatch secure email download links.
- **Follow-Up**: Track client view/download receipts.
- **Audit Trail**: `QuarterlyPackBatchRun`, `ReportsDelivered`.

---

### Workflow 13: Compliance & Supervisory Audit
- **Trigger**: Monthly internal compliance check or SEBI inspection readiness review.
- **Context**: Entire firm transaction and advisory log.
- **Information**: Compliance supervisor dashboard flags: Any portfolios with unapproved mandate breaches, unacknowledged risk profile expirations (>3 years old), or undocumented AI-assisted recommendations.
- **Decision**: Require advisors to provide documented justification or remediate portfolio drift.
- **Action**: Export immutable Audit Trail Log with cryptographic timestamp integrity.
- **Follow-Up**: Auto-notify advisors with pending compliance rectifications.
- **Audit Trail**: `ComplianceAuditExported`, `SupervisorReviewSigned`.

---

### Workflow 14: Client & Household Onboarding
- **Trigger**: New HNI prospect signs advisory agreement.
- **Context**: Malhotra Family (Husband, Wife, HUF, Holding Co).
- **Information**: Upload Consolidated Account Statement (CAS PDF) and Zerodha/Kite Excel exports. Ingestion parser normalizes 65 holdings across 4 entities in < 15 seconds.
- **Decision**: Assign Risk Mandates (Husband: Growth, Wife: Balanced, HUF: Long-Term Compounding).
- **Action**: Link all 4 sub-portfolios into the Unified Household Workspace.
- **Follow-Up**: Schedule Initial Strategy Presentation meeting.
- **Audit Trail**: `HouseholdCreated`, `CASIngested`, `MandatesAssigned`.

---

### Workflow 15: Household Consolidated Review
- **Trigger**: Family office principal requests consolidated estate and wealth overview.
- **Context**: 5 individual portfolios, 2 corporate entities, ₹45 Cr combined net worth.
- **Information**: Multi-entity consolidated balance sheet: combined equity exposure, total liquidity across bank accounts & liquid funds, aggregate real estate valuations, inter-entity loans, and succession goal assignments.
- **Decision**: Identify redundant overlapping fund holdings across family accounts (e.g., 4 family members holding the same 3 mutual funds independently).
- **Action**: Propose consolidated clean-up strategy to reduce fees and simplify tracking.
- **Follow-Up**: Prepare Family Office Estate & Portfolio Deck.
- **Audit Trail**: `HouseholdConsolidationViewed`, `OverlapAnalysisRun`.

---

### Workflow 16: Periodic Mandate & Suitability Review
- **Trigger**: Annual client risk profile re-certification (SEBI RIA compliance mandate).
- **Context**: Client turned 60 or retired from active business.
- **Information**: Updated risk questionnaire score reduces risk tolerance from "Aggressive Growth" to "Capital Preservation & Income".
- **Decision**: Transition target asset allocation from 80/20 Equity/Debt to 40/60 Equity/Debt over a phased 6-month glide path.
- **Action**: Update Portfolio Mandate in system, generating a phased transition schedule.
- **Follow-Up**: Send revised Investment Policy Statement (IPS) for client digital signature.
- **Audit Trail**: `MandateUpdated`, `SuitabilityCheckCompleted`.

---

### Workflow 17: Market Event & Sudden Crisis Response
- **Trigger**: Sudden market crash (e.g., Nifty down 4.5% on election surprise or global crisis).
- **Context**: Influx of anxious client calls and messages.
- **Information**: Command Center "Crisis Response Scanner" instantly identifies all clients with > 70% equity exposure or holding high-beta small-cap funds.
- **Decision**: Prepare a proactive, unified "Market Perspective" broadcast memo rather than reacting frantically to 50 individual calls.
- **Action**: Copilot drafts an institutional market commentary grounded in the firm's historical drawdown playbook; advisor customizes and broadcasts to affected clients.
- **Follow-Up**: Prioritize top 10 most anxious/vulnerable clients for personal phone outreach.
- **Audit Trail**: `CrisisScanExecuted`, `BroadcastMemoLogged`.

---

### Workflow 18: Exception & Reconciliation Break Management
- **Trigger**: Daily morning data sync detects an anomaly (e.g., holding mismatch between broker contract note and custodian ledger).
- **Context**: Client portfolio *Aditi Rao (Individual)*: 500 shares of Infosys reported by broker vs 400 in internal ledger.
- **Information**: Discrepancy detector flags missing bonus issue transaction or unrecorded off-market transfer.
- **Decision**: Back-office operations approves ledger adjustment with uploaded source contract note proof.
- **Action**: Discrepancy resolved, portfolio valuation recomputed instantly.
- **Follow-Up**: Remove exception flag from advisor morning dashboard.
- **Audit Trail**: `ReconciliationBreakResolved`, `LedgerAdjusted`.

---

## 2. Day-in-the-Life Model: An Advisor’s Day in AssetArray 4.0

```
====================================================================================================
TIME     STAGE             SCREEN / SURFACE        ACTIONS & COGNITIVE LEVERAGE
====================================================================================================
08:30 AM Morning Briefing  Command Center          • Checks "What Needs Attention Today?"
                                                   • 2 concentration breaches, 1 client meeting.
                                                   • Dismisses noise; accepts daily task queue.

09:15 AM Market Open       Market & Models         • Reviews model portfolio performance vs Nifty.
                                                   • Verifies corporate action sync from morning batch.

10:30 AM Meeting Prep      Client 360 -> Briefing  • Opens Vikram Malhotra (11:00 AM meeting).
                                                   • One-click review: Net Worth, Drift, Goals, Tax Opps.
                                                   • AI Copilot drafts 3 talking points. Prep time: 4 mins.

11:00 AM Client Meeting    Client Meeting Mode     • Switches to client-safe presentation view.
                                                   • Reviews ₹18.5 Cr household wealth & daughter's goal.
                                                   • Simulates rebalance on interactive slider.
                                                   • Client approves ₹50L equity-to-debt rebalance.

11:45 AM Post-Meeting Wrap Copilot & Tasks         • Reviews AI-drafted meeting follow-up email & WhatsApp.
                                                   • Edits 1 sentence; clicks "Dispatch & Assign Ops Task".
                                                   • Follow-up completed in under 90 seconds.

01:30 PM Rebalance Ops     Portfolio -> Rebalance  • Opens morning approved rebalance queue.
                                                   • Runs Tax Lot Engine: Minimizes FY26 capital gains.
                                                   • Generates export batch for custodian upload.

03:00 PM Deep Research     Research Workstation    • Evaluates new Multi-Asset Allocation Fund.
                                                   • Inspects historical rolling returns & credit quality.
                                                   • Adds to Firm Approved Buy List with 5% cap.

04:30 PM Goal & Tax Sweep  Tax & Goals Domain      • Scans for clients with unutilized ₹1.25L LTCG exempt.
                                                   • Flags 14 clients for March tax-loss harvesting.
                                                   • Bulk-creates advisor review tasks.

05:30 PM End-of-Day Close  Command Center          • Reviews completed tasks (8/8 closed).
                                                   • Verifies all client interactions are audit-logged.
                                                   • Logs out with complete peace of mind.
====================================================================================================
```
