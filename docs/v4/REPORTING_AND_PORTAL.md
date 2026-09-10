# ASSETARRAY 4.0 — REPORTING HIERARCHY & CLIENT PORTAL
**Institutional Advisor Platform Product Blueprint**

---

## 1. Professional Reporting Hierarchy

AssetArray 4.0 replaces generic chart printouts with an institutional **Multi-Tier Reporting Engine** producing pixel-perfect, branded, verifiable documents.

```
+----------------------------------------------------------------------------------------------------+
| REPORTING HIERARCHY MATRIX                                                                         |
+---------------------+---------------------+--------------------------------------------------------+
| Report Tier         | Target Audience     | Core Contents & Structure                              |
+---------------------+---------------------+--------------------------------------------------------+
| 1. Client Quarterly | HNI Client & Family | • Executive Net Worth & Household Summary              |
|    Review Pack      | Office Principal    | • Time-Weighted (TWR) & Money-Weighted (XIRR) Returns  |
|                     |                     | • Asset Allocation vs Benchmark Performance            |
|                     |                     | • Goal Progression & Milestone Projections             |
|                     |                     | • Capital Gains Summary & Statutory Disclosures        |
+---------------------+---------------------+--------------------------------------------------------+
| 2. Executive Meeting| Advisor (Pre-Meet)  | • 1-Page Condensed Cockpit: What Changed, Drift, Risks |
|    Brief            |                     | • Copilot Talking Points & Open Action Items           |
+---------------------+---------------------+--------------------------------------------------------+
| 3. Tax Certificate &| Client Chartered    | • Detailed Lot-by-Lot Realized Capital Gains (Sec 70)  |
|    P&L Pack         | Accountant (CA)     | • Dividend TDS Breakdown & Carry-Forward Losses (Sec 74|
|                     |                     | • Official ISIN Mapping & Transaction Ledger           |
+---------------------+---------------------+--------------------------------------------------------+
| 4. Investment Comm. | Firm Partners &     | • Multi-Factor Risk Attribution & Beta Analysis        |
|    Strategy Pack    | Research Analysts   | • Model Portfolio Tracking Error & Sector Exposure     |
|                     |                     | • Cash Drag & Fund Liquidity Profile                   |
+---------------------+---------------------+--------------------------------------------------------+
```

---

## 2. Dynamic Report Assembly & Branding Engine
- **Firm White-Labeling**: Customizable firm logo, brand color accents, advisor contact card, and statutory registration badges (e.g., *SEBI Reg No: INA000012345*).
- **Source Citation Footnotes**: Every return chart and valuation table includes explicit footnotes indicating data sources, closing valuation dates, and calculation methodologies.
- **Batch Export**: Ability to generate 150 client quarterly review PDFs in under 90 seconds via asynchronous background worker queues.

---

## 3. Client Portal V4 Strategy

```
+-------------------------------------------------------------------------------+
| THE CLIENT PORTAL V4 SURFACE (Web & Mobile Responsive)                       |
+-------------------------------------------------------------------------------+
| CORE CAPABILITIES:                                                            |
| 1. Consolidated Household Wealth View (Clean, simplified, high-contrast UI)   |
| 2. Goal Funding Gauges (Real-time progress toward education / retirement)     |
| 3. Document Vault (Download signed IPS, quarterly reports, and tax packs)     |
| 4. Interactive Approvals: Digital sign-off for rebalancing and SIP renewals   |
| 5. Direct Advisor Messaging: Secure direct line to relationship manager       |
+-------------------------------------------------------------------------------+
```

### Security & Phased Rollout
- **Phase 1 (V4.0)**: Client Portal runs in **Read-Only + Document Vault Mode** with Magic Link authentication.
- **Phase 2 (V4.2)**: Interactive Approvals and Direct Messaging enabled.
- **Strict Data Scoping**: Client users have zero visibility into other tenants, other households, internal advisor fee margins, or compliance supervisory logs.
