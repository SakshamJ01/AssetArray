import { DecisionStateMachine } from '../src/services/v4/workflow/decisionModel';
import { AdvisorDecision, DecisionStatus } from '../src/types/v4/workflow';

describe('V4 Phase 3 — Advisor Decisions Lifecycle & Immutability', () => {
  const baseDecision: AdvisorDecision = {
    decisionId: 'dec_001',
    tenantId: 'firm_alpha',
    clientId: 'client_101',
    portfolioId: 'port_10',
    decisionType: 'REBALANCE',
    subject: 'Approve Tactical Rebalance Proposal',
    context: 'Portfolio drift exceeded 15% threshold in international equity.',
    evidence: {
      sourceType: 'REBALANCE_PROPOSAL',
      sourceId: 'prop_001',
      riskImpact: { priorRiskScore: 65, targetRiskScore: 60, postTradeRiskScore: 61 }
    },
    beforeState: { driftScore: 18.5 },
    proposedAction: { targetDriftScore: 1.2 },
    decision: 'DEFER',
    decisionStatus: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };

  test('Permits legal approval by ADVISOR role', () => {
    const approved = DecisionStateMachine.approveDecision(
      baseDecision,
      'advisor_123',
      'ADVISOR',
      'Confirmed with client on quarterly review call'
    );

    expect(approved.decision).toBe('APPROVE');
    expect(approved.decisionStatus).toBe('APPROVED');
    expect(approved.decidedBy).toBe('advisor_123');
    expect(approved.decidedAt).toBeDefined();
    expect(approved.notes).toBe('Confirmed with client on quarterly review call');
  });

  test('Permits legal rejection with mandatory reason', () => {
    const rejected = DecisionStateMachine.rejectDecision(
      baseDecision,
      'advisor_123',
      'ADVISOR',
      'Tax impact of $12,000 exceeds client yearly limit'
    );

    expect(rejected.decision).toBe('REJECT');
    expect(rejected.decisionStatus).toBe('REJECTED');
    expect(rejected.decidedBy).toBe('advisor_123');
    expect(rejected.reason).toBe('Tax impact of $12,000 exceeds client yearly limit');
  });

  test('Rejects approval without authorized role (e.g. READONLY or GUEST)', () => {
    expect(() => {
      DecisionStateMachine.approveDecision(baseDecision, 'guest_1', 'ANALYST');
    }).toThrow(/not authorized to approve/i);
  });

  test('Prevents double approval', () => {
    const approved = DecisionStateMachine.approveDecision(baseDecision, 'advisor_1', 'ADVISOR');
    expect(() => {
      DecisionStateMachine.approveDecision(approved, 'advisor_2', 'ADMIN');
    }).toThrow(/already approved/i);
  });

  test('Enforces immutability: Rejects modification of approved decision subject or evidence', () => {
    const approved = DecisionStateMachine.approveDecision(baseDecision, 'advisor_1', 'ADVISOR');

    expect(() => {
      DecisionStateMachine.validateImmutability(approved, { subject: 'Modified Subject' });
    }).toThrow(/immutable/i);

    expect(() => {
      DecisionStateMachine.validateImmutability(approved, { proposedAction: { newKey: 'val' } });
    }).toThrow(/immutable/i);
  });

  test('Validates required fields in decision payload', () => {
    expect(() => {
      DecisionStateMachine.validatePayload({ tenantId: 'firm_1', clientId: '' });
    }).toThrow(/clientId is required/i);

    expect(() => {
      DecisionStateMachine.validatePayload({ tenantId: 'firm_1', clientId: 'c1', subject: '' });
    }).toThrow(/subject is required/i);
  });
});
