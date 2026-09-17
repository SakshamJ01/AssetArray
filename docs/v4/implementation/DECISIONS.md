# AssetArray V4.0 — Phase 3: Advisor Decision Model & Approval Workflow

## Decision Entity Model
The `AdvisorDecision` model enforces formal fiduciary recordkeeping:

```typescript
export interface AdvisorDecision {
  decisionId: string;
  tenantId: string;
  clientId: string;
  householdId?: string;
  portfolioId?: string;
  decisionType: 'REBALANCE' | 'TAX_HARVEST' | 'GOAL_ADJUSTMENT' | 'RISK_PROFILE_CHANGE' | 'HOLDING_EXCEPTION' | 'MEETING_ACTION' | 'CLIENT_REVIEW';
  subject: string;
  context: string;
  evidence: DecisionEvidence;
  beforeState: Record<string, unknown>;
  proposedAction: Record<string, unknown>;
  decision: 'APPROVE' | 'REJECT' | 'DEFER';
  decisionStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

## Fiduciary Governance & Immutability
1. **Approval Rules**: Decisions can only be approved by authorized roles (`ADVISOR`, `ADMIN`, `COMPLIANCE`).
2. **Double Approval Prevention**: An already approved decision cannot be approved a second time.
3. **Immutability Protection**: Once a decision is in `APPROVED` or `REJECTED` status, core fields (subject, context, beforeState, proposedAction, evidence, decidedBy, decidedAt) are immutable.
4. **Superseding**: Any change to a finalized decision requires creating a new version or superseding decision record.
