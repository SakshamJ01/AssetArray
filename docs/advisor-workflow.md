# Advisor Workflow & Action Engine

## Lifecycle & State Machine
Every action in AssetArray V3.3 follows an auditable fiduciary lifecycle:

```
[ OPEN ] ──(Advisor Starts)──> [ IN_PROGRESS ] ──(Waiting on Client)──> [ WAITING ]
   │                                  │                                    │
   ├──(Snooze 24h)──> [ SNOOZED ]     └──(Decision Executed)───────────────┤
   │                         │                                             │
   │                         └──(Window Expires)──> [ OPEN ]               ▼
   └─────────────────────────────────────────────────────────────────> [ DONE ]
```

---

## Canonical Task Deduplication
To prevent alert storms and duplicate task generation when multiple engine runs occur:
- Canonical Key: `clientId:sourceType:sourceId:actionType`
- If an existing task exists with the canonical key, its lifecycle status (`IN_PROGRESS`, `DONE`, `SNOOZED`), advisor notes, and completion timestamps are preserved.

---

## 1-Click Deep Links
Every action card includes a primary deep link targeting the exact context:

| Issue Type | Target Tab | Target Screen / Module |
| :--- | :--- | :--- |
| **Concentration Breach** | `Portfolios` | Risk > Concentration |
| **Portfolio Health Degradation** | `Portfolios` | Diagnostic > Health Score |
| **Tax Loss Opportunity** | `Portfolios` | Tax > Loss Harvesting |
| **Drawdown Alert** | `Portfolios` | Risk > Drawdown |
| **Allocation Drift** | `Portfolios` | Rebalancer |
| **Client Mandate Review** | `Clients` | Profile & Mandate |
| **Goal Deficit** | `Tools` | Goal Planner |
| **Data Quality Deficit** | `Portfolios` | Holdings > Tax Lots |

---

## Opportunity Center vs Risk Alerts
Risks and positive wealth opportunities are strictly segregated:
- **Risks**: Concentration breaches, drawdown violations, overdue reviews.
- **Opportunities**:
  - Capital loss harvesting windows under Section 70/74.
  - Asset allocation rebalancing drift.
  - Goal catch-up acceleration SIPs.
  - Excess idle cash drag deployment (>25% cash).
