# AssetArray V3.3 — Advisor Command Center Architecture

## Executive Overview
AssetArray V3.3 evolves the platform from a portfolio analytics tool into a daily-use **Advisor Operating System** (Advisor OS). The Advisor Command Center is designed around the five fundamental daily questions an advisor asks upon opening the platform:

1. **WHO needs attention?** (Clients with critical risk breaches, scheduled reviews, or overdue touchpoints).
2. **WHAT changed?** (Asset concentration breaches, portfolio health degradations, market drift, milestone lags).
3. **WHY did it change?** (Detailed fiduciary evidence, policy thresholds, and single-stock movements).
4. **WHAT should I do next?** (Deterministic next steps with 1-click deep links to Rebalancer, Tax Harvesting, or Scenario Sandbox).
5. **HOW do I communicate that decision to the client?** (Report generation, client communication hub, and auditable fiduciary decision logging).

```
OBSERVE ↓ UNDERSTAND ↓ PRIORITIZE ↓ ACT ↓ COMMUNICATE ↓ RECORD
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ADVISOR COMMAND CENTER                   │
├──────────────────────────────┬──────────────────────────────┤
│  PRIORITY ACTION QUEUE       │  MARKET PULSE & DAILY BRIEF  │
│  - Urgent / Today / Upcoming │  - Nifty, Sensex, USD/INR    │
│  - Why This Matters (Proof)  │  - Grounded AI Advisor Brief │
│  - 1-Click Deep Links        │  - Workflow KPIs             │
├──────────────────────────────┼──────────────────────────────┤
│  CLIENT 360 WORKSPACE        │  OPPORTUNITIES & DATA HYGIENE│
│  - Portfolio AUM & Health    │  - Tax Loss Harvesting       │
│  - Risk & Goals Status       │  - Allocation Drift          │
│  - Activity Timeline         │  - Missing Cost Basis/Dates  │
│  - Next Recommended Action   │  - Excess Cash Drag          │
├──────────────────────────────┴──────────────────────────────┤
│  DECISION JOURNAL & CRM AUDIT TRAIL                         │
│  - Date · Client · Issue · Evidence · Decision · Follow-up  │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Domain Models

### `AdvisorAction`
```typescript
interface AdvisorAction {
  id: string;
  canonicalKey: string; // Composite key: clientId:sourceType:sourceId:actionType
  clientId: string;
  clientName: string;
  portfolioId?: string;
  type: AdvisorActionType;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  priorityScore: number; // 0 - 100 explainable score
  priorityFactors: PriorityScoreFactors;
  severity?: "critical" | "warning" | "info";
  title: string;
  description: string;
  reason: string; // "Why this matters"
  evidence: ActionEvidence;
  createdAt: string;
  dueAt?: string;
  status: AdvisorActionStatus;
  sourceEngine: "risk" | "tax" | "goals" | "attribution" | "health" | "reminders" | "data_quality";
  recommendedNextStep?: string;
  deepLink: ActionDeepLink;
  snoozedUntil?: string | null;
  completedAt?: string | null;
}
```

---

## Transparent Prioritization Model
Prioritization does not use black-box heuristics or LLM ranking. The priority score (0-100) is deterministically computed as:

$$\text{Priority Score} = \frac{\text{Severity} \times 0.30 + \text{Financial Impact} \times 0.25 + \text{Urgency} \times 0.20 + \text{Client Importance} \times 0.15 + \text{Data Confidence} \times 0.10}{5} \times 100$$

All factors (1-5 scale) are inspectable in the UI under **"Why This Matters"**.

---

## Horizon Modes
- **TODAY**: Urgent actions, overdue touchpoints, and scheduled rebalancing due today.
- **THIS WEEK**: Scheduled portfolio reviews and tactical mandates.
- **THIS MONTH**: Long-term milestone reconciliations, year-end tax planning, and client outreach.
