# AssetArray V4.0 — Phase 3: Advisor Task Model & Lifecycle

## Task Entity Model
The `AdvisorTask` entity serves as a first-class workflow unit within AssetArray V4.0:

```typescript
export interface AdvisorTask {
  taskId: string;
  tenantId: string;
  clientId: string;
  householdId?: string;
  portfolioId?: string;
  title: string;
  description: string;
  type: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED' | 'SNOOZED';
  ownerUserId: string;
  createdBy: string;
  dueAt?: string;
  source: 'ALERT' | 'RECONCILIATION' | 'REBALANCE_PROPOSAL' | 'GOAL' | 'TAX' | 'CLIENT_REVIEW' | 'MANUAL' | 'MEETING_FOLLOW_UP';
  sourceEntityId?: string;
  evidence?: TaskEvidence;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completionNote?: string;
  snoozedUntil?: string;
  blockReason?: string;
  cancellationReason?: string;
}
```

## State Machine Transitions
```
OPEN
 ├──→ IN_PROGRESS ──→ DONE (with completion note)
 ├──→ SNOOZED (requires snoozedUntil timestamp)
 ├──→ BLOCKED (requires blockReason)
 ├──→ CANCELLED (requires cancellationReason)
 └──→ DONE (direct completion)
```

## Bridge from Phase 2 Computation
- **Reconciliation Break** → `TaskGenerator.fromReconciliation` (includes expected, observed, and difference quantity).
- **Rebalance Drift** → `TaskGenerator.fromRebalanceProposal` (includes drift score, candidate trades, tax estimate).
- **Tax Harvesting Opportunity** → `TaskGenerator.fromTaxOpportunity` (includes lot unrealized loss and tax savings).
- **Goal Deterioration** → `TaskGenerator.fromGoalDeterioration` (includes historical vs current Monte Carlo probability).
- **Deduplication**: Automatically suppresses redundant task creation when an open task already exists for the same entity break.
