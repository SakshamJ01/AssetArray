# AssetArray V4.0 — Reporting Layer Architecture

## 1. Overview & Architectural Principle
The Reporting Layer in AssetArray V4.0 is strictly a **presentation and communication tier**. It does not perform primary financial calculation or create synthetic numbers. All numbers, metrics, and allocations presented in reports are sourced deterministically from canonical ledger state, audited calculation engines (TWR, XIRR, Section 70/74 Tax, Risk, Drift Corridors), and verified workflow decisions.

```text
CANONICAL DATA (Portfolio Ledger, Tax Lots, Positions)
        ↓
DETERMINISTIC CALCULATIONS (TWR, XIRR, Drift, Tax Section 70/74)
        ↓
WORKFLOW STATE & EVIDENCE (Approved Decisions, Meeting Records)
        ↓
REPORT SNAPSHOT MODEL (Immutable, Versioned, Timestamped)
        ↓
CLIENT-SAFE BOUNDARY FILTER (Excludes internal notes, diagnostics)
        ↓
RENDERER (HTML / CSS / PDF / Web Preview / Investor Portal)
        ↓
SECURE EXPORT & SHARE (Ephemeral, Authenticated, Audited)
```

## 2. Core Separation of Responsibilities
1. **The Database is not the Report**: A live query is never directly passed as a client report. Reports must be captured into an immutable, versioned snapshot (`ReportSnapshot`) with an explicit `dataSnapshotVersion`.
2. **The Report is not the Live Database**: Subsequent portfolio updates or market changes will never retroactively modify or mutate an already generated and approved historical report.
3. **AI Narrative Grounding**: AI synthesis may generate summaries or plain-language commentary, but all referenced numerical values must strictly match the deterministic metrics within the report context. Unverified numeric claims are rejected.
4. **Human Review & Approval Boundary**: Client-facing reports cannot be automatically published. Every report must traverse explicit state transitions (`GENERATED` → `REVIEWED` → `APPROVED` → `PUBLISHED`).

## 3. Supported Report Types
| Report Type | Target Audience | Scope & Content | Client Portal Safe |
| :--- | :--- | :--- | :--- |
| `INTERNAL_ADVISOR_REPORT` | Wealth Advisors & Relationship Managers | Comprehensive portfolio state, reconciliation status, custody breaks, private notes, open tasks | ❌ No (Internal Only) |
| `CLIENT_REVIEW_REPORT` | Investors & Family Offices | Strategic allocations, performance (TWR), goal progression, harvestable tax summary, next steps | ✅ Yes (Post-Approval) |
| `INVESTMENT_COMMITTEE_REPORT` | Investment Committee & Compliance | Proposed rebalance impact, pre/post drift scores, tax realization estimates, asset allocation drift | ❌ No (Internal Only) |
| `MEETING_FOLLOW_UP_PACK` | Clients & Meeting Participants | Meeting discussion record, decisions taken, agreed action items, owners, target due dates | ✅ Yes (Post-Approval) |

## 4. Multi-Currency & Presentation Standards
- **Currencies Supported**: `INR` (with Indian numbering `₹ Cr / L`), `USD` (`$`), `EUR` (`€`), `GBP` (`£`).
- **Standardized Footers**: GIPS-aligned performance disclosures, Section 70/74 tax estimation disclaimers, and fiduciary responsibility notices.
