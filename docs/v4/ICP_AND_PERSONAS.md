# ASSETARRAY 4.0 — ICP & USER PERSONAS
**Institutional Advisor Platform Product Blueprint**

---

## 1. Ideal Customer Profile (ICP) Definition

AssetArray 4.0 targets a sharply focused primary customer profile rather than attempting to serve retail self-directed investors, massive universal retail banks, or algorithmic hedge funds.

```
+-------------------------------------------------------------------------------+
| PRIMARY ICP: INDEPENDENT WEALTH ADVISORS & BOUTIQUE WEALTH MANAGEMENT FIRMS   |
+-------------------------------------------------------------------------------+
| Firm Type:       SEBI-registered Investment Advisers (RIAs), PMS boutiques,   |
|                  Multi-Family Offices (MFOs), Independent Financial Planners  |
| Firm Size:       2 to 25 professionals (Advisors, Analysts, Ops)              |
| AUM Managed:     ₹50 Crore to ₹2,500 Crore ($6M to $300M USD)                 |
| Client Count:    50 to 500 High-Net-Worth (HNI) & Ultra-HNI Families          |
| Average Ticket:  ₹1 Crore to ₹25 Crore per client household                   |
| Tech Reality:    Currently cobbling together Google Sheets, Zerodha/Kite,     |
|                  CAMS/KFintech CAS PDFs, WhatsApp groups, and generic CRMs    |
| Core Pain:       15+ hours/week lost in manual reconciliation, meeting prep,  |
|                  tax calculations, and ad-hoc client WhatsApp panic answering |
+-------------------------------------------------------------------------------+
```

### Why This ICP?
1. **High Willingness to Pay for Leverage**: A firm managing ₹250 Cr earns ₹1.25 Cr–₹2.5 Cr in annual advisory fees. Saving 10 advisor hours per week directly translates to managing 20% more clients without expanding head-count.
2. **Underserved by Institutional Legacy Tech**: Legacy software (Bloomberg, BlackRock Aladdin) is prohibitively expensive ($25k–$100k/seat/year), while retail tools (Groww, Zerodha, INDmoney) lack institutional mandate compliance, tax-aware multi-portfolio rebalancing, and client-ready reporting.
3. **Complex Household Topologies**: Indian HNI wealth is spread across individual accounts, HUF (Hindu Undivided Family) entities, family trusts, and private limited companies. Standard retail trackers fail completely here.

---

## 2. User Persona Matrix

```
+--------------------------+---------------------+-------------------+---------------------+
| Persona                  | Role Tier           | Priority Level    | Platform Experience |
+--------------------------+---------------------+-------------------+---------------------+
| Rajan Mehta (Principal)  | Primary Lead        | Tier 1 (Crown)    | Command & Decision  |
| Priya Sharma (RM/Adv)    | Primary Execution   | Tier 1 (Crown)    | Client 360 & Copilot|
| Amitav Ghosh (Analyst)   | Secondary Research  | Tier 2            | Research & Engine   |
| Sunita Rao (Ops/Admin)   | Secondary Operations| Tier 2            | Ingest & Reconcile  |
| Vikram Malhotra (Client) | Secondary Investor  | Tier 3 (Portal)   | Read-Only Approval  |
+--------------------------+---------------------+-------------------+---------------------+
```

---

## 3. Detailed Persona Profiles

### Persona 1: Senior Wealth Advisor / Partner (Primary — Tier 1)
- **Representative Archetype**: *Rajan Mehta (46), Managing Partner at a ₹400 Cr Boutique RIA, Mumbai*
- **Primary Goals**:
  - Protect and grow client wealth aligned with agreed Investment Policy Statements (IPS).
  - Walk into any client meeting with 100% confidence, immediate context, and zero preparation panic.
  - Scale practice from 75 to 150 client families without hiring 5 new junior analysts.
- **Recurring Daily/Weekly Tasks**:
  - Review morning market moves and identify affected client portfolios.
  - Conduct 3–4 high-stakes client review meetings.
  - Approve rebalance proposals and tax-loss harvesting recommendations.
  - Sign off on quarterly performance packs and regulatory compliance filings.
- **Frustrations & Pain Points**:
  - *Data Fragmentation*: Logging into 4 broker portals, 2 RTA dashboards, and 10 spreadsheets before a call.
  - *Stale Context*: Forgetting what tax strategy or allocation restriction was agreed upon 3 months ago.
  - *Compliance Anxiety*: Worrying whether a junior RM recommended an ungrounded strategy or missed a concentration limit.
- **Key Decisions Made**:
  - Asset allocation shifts (e.g., Equity to Debt duration).
  - Approval of tax-loss harvesting trades prior to March 31.
  - Exception waivers on mandate limits with documented rationale.
- **Permissions**: Full Tenant Access (Read/Write/Approve/Export/Admin).
- **Frequency of Use**: Daily (4–6 hours active use on Desktop; mobile on the move).

---

### Persona 2: Associate Relationship Manager (Primary — Tier 1)
- **Representative Archetype**: *Priya Sharma (29), Relationship Manager, Bengaluru*
- **Primary Goals**:
  - Keep 40 client families delighted, informed, and responsive.
  - Turn advisor decisions into actionable trade lists, client communications, and tasks.
  - Rapidly answer spontaneous client questions ("Why is my midcap fund down 4% today?").
- **Recurring Tasks**:
  - Generate meeting briefs and follow-up memos.
  - Track goal progress (e.g., children's foreign education in 3 years).
  - Follow up on pending client approvals (SIP renewals, portfolio rebalance sign-offs).
- **Frustrations**:
  - Spending 45 minutes manually drafting email follow-ups after a 30-minute Zoom call.
  - Manually calculating post-tax capital gains on mutual fund switches.
- **Key Decisions Made**:
  - Propose meeting agendas, draft communication copy, prioritize daily follow-up calls.
- **Permissions**: Assigned Clients Only (Read/Write/Draft; Approval requires Senior Advisor).
- **Frequency of Use**: Continuous (6–8 hours daily).

---

### Persona 3: Investment Analyst (Secondary — Tier 2)
- **Representative Archetype**: *Amitav Ghosh (32), Head of Research, New Delhi*
- **Primary Goals**:
  - Maintain the firm’s Model Portfolios (Aggressive Growth, Balanced Advantage, Conservative Income).
  - Perform deep fundamental and risk research on new equities, mutual funds, and debt instruments.
  - Stress-test model allocations against historical crises (2008 GFC, 2020 COVID, 2022 Rate Spike).
- **Recurring Tasks**:
  - Run multi-factor risk attribution and tracking error calculations.
  - Screen for corporate governance alerts, credit rating downgrades, and quarterly earnings surprises.
  - Update model portfolio weights and push rebalance signals to advisor queues.
- **Key Decisions Made**:
  - Instrument inclusion/exclusion on the firm's Approved Buy List.
  - Model portfolio reweighting recommendations.
- **Permissions**: Research, Models, Analytics (Read/Write Models; No direct client PII access required).
- **Frequency of Use**: Daily (3–5 hours focused analytical work).

---

### Persona 4: Operations & Back-Office Specialist (Secondary — Tier 2)
- **Representative Archetype**: *Sunita Rao (38), Operations Lead, Pune*
- **Primary Goals**:
  - Ensure 100% data integrity between custodian/broker feeds and client portfolio ledgers.
  - Ingest CAMS/KFintech CAS files, contract notes, and bank statements with zero discrepancies.
  - Resolve reconciliation breaks before advisors open their morning dashboard.
- **Recurring Tasks**:
  - Upload batch statements and reconcile holding quantities, cash balances, and tax lots.
  - Fix corporate action corporate splits, bonus issues, and dividend reinvestment records.
  - Generate client quarterly billing fee schedules (AUM-based fixed/percentage fees).
- **Key Decisions Made**:
  - Confirm transaction ledger adjustments and map unmapped ISINs.
- **Permissions**: Data Ingestion, Reconciliation, Billing, Audit Logs (Admin Ops).
- **Frequency of Use**: Daily (2–4 hours morning batch and evening reconciliation).

---

### Persona 5: End Client / Family Office Principal (Secondary — Tier 3 Portal)
- **Representative Archetype**: *Vikram Malhotra (54), Founder/CEO & HNI Investor, Gurugram*
- **Primary Goals**:
  - View total consolidated household wealth at a glance across family members and entities.
  - Verify that investments are tracking on schedule toward family retirement and succession goals.
  - Review and digitally approve rebalance proposals and tax harvesting plans.
- **Frustrations**:
  - Overly complex 80-page PDF reports filled with unexplained financial jargon.
  - Lack of clear answers on real net returns (XIRR post-tax and post-fees).
- **Key Decisions Made**:
  - Approve major rebalance initiatives and fund transfers.
- **Permissions**: Client Portal (Strictly Scoped Read-Only for Household; Interactive Approvals).
- **Frequency of Use**: Weekly to Monthly (10–15 minutes on mobile or tablet).

---

## 4. Persona Experience Prioritization

```
+-------------------------------------------------------------------------------+
| THE CROWN EXPERIENCE: The Senior Advisor & Relationship Manager               |
+-------------------------------------------------------------------------------+
| If AssetArray does not save the Advisor 10 hours a week and make them feel   |
| completely in control during client meetings, the product fails commercially. |
| Every screen, query latency, and Copilot prompt is tuned first for the        |
| Advisor's cognitive flow during a 10-hour working day.                        |
+-------------------------------------------------------------------------------+
```
