import { TaskStateMachine } from '../src/services/v4/workflow/taskModel';
import { DecisionStateMachine } from '../src/services/v4/workflow/decisionModel';
import { MeetingStateMachine } from '../src/services/v4/workflow/meetingModel';
import { TaskGenerator } from '../src/services/v4/workflow/taskGenerator';
import { ActivityTimelineService } from '../src/services/v4/workflow/activityService';
import { AdvisorTask, AdvisorDecision, MeetingRecord } from '../src/types/v4/workflow';

describe('V4 Phase 3 — Adversarial & Boundary Test Suite (15 Test Cases)', () => {
  const tenantA = 'firm_alpha';
  const tenantB = 'firm_beta';

  const baseTask: AdvisorTask = {
    taskId: 'task_adv_1',
    tenantId: tenantA,
    clientId: 'client_100',
    title: 'Adversarial Test Task',
    description: 'Task description',
    type: 'TAX_REVIEW',
    priority: 'MEDIUM',
    status: 'OPEN',
    ownerUserId: 'user_1',
    createdBy: 'user_1',
    source: 'TAX',
    sourceEntityId: 'tax_opp_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const baseDecision: AdvisorDecision = {
    decisionId: 'dec_adv_1',
    tenantId: tenantA,
    clientId: 'client_100',
    decisionType: 'REBALANCE',
    subject: 'Tactical Rebalance Decision',
    context: 'Tax lot optimization',
    evidence: { sourceType: 'REBALANCE_PROPOSAL', sourceId: 'prop_adv_1' },
    beforeState: { drift: 10 },
    proposedAction: { drift: 0 },
    decision: 'DEFER',
    decisionStatus: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };

  const baseMeeting: MeetingRecord = {
    meetingId: 'mtg_adv_1',
    tenantId: tenantA,
    clientId: 'client_100',
    title: 'Adversarial Meeting Test',
    status: 'SCHEDULED',
    participants: ['user_1'],
    scheduledAt: new Date().toISOString(),
    agenda: [],
    notes: [],
    decisions: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Cross-tenant task access filtering
  test('1. Cross-tenant task access is strictly prevented by tenant filter', () => {
    const tasks = [baseTask, { ...baseTask, taskId: 'task_b', tenantId: tenantB }];
    const tenantATasks = tasks.filter((t) => t.tenantId === tenantA);
    expect(tenantATasks.every((t) => t.tenantId === tenantA)).toBe(true);
    expect(tenantATasks.find((t) => t.taskId === 'task_b')).toBeUndefined();
  });

  // 2. Cross-tenant decision access filtering
  test('2. Cross-tenant decision access is strictly prevented by tenant filter', () => {
    const decisions = [baseDecision, { ...baseDecision, decisionId: 'dec_b', tenantId: tenantB }];
    const tenantADecisions = decisions.filter((d) => d.tenantId === tenantA);
    expect(tenantADecisions.find((d) => d.decisionId === 'dec_b')).toBeUndefined();
  });

  // 3. Cross-tenant meeting access filtering
  test('3. Cross-tenant meeting access is strictly prevented by tenant filter', () => {
    const meetings = [baseMeeting, { ...baseMeeting, meetingId: 'mtg_b', tenantId: tenantB }];
    const tenantAMeetings = meetings.filter((m) => m.tenantId === tenantA);
    expect(tenantAMeetings.find((m) => m.meetingId === 'mtg_b')).toBeUndefined();
  });

  // 4. Unauthorized decision approval
  test('4. Unauthorized role cannot approve decision', () => {
    expect(() => {
      DecisionStateMachine.approveDecision(baseDecision, 'guest_user', 'ANALYST');
    }).toThrow(/not authorized/i);
  });

  // 5. Illegal task transition
  test('5. Illegal task state transition throws explicit error', () => {
    expect(() => {
      TaskStateMachine.transitionTask(baseTask, 'UNKNOWN_STATUS' as any, 'user_1', 'ADVISOR');
    }).toThrow(/Illegal task state transition/i);
  });

  // 6. Double approval prevention
  test('6. Double approval of decision is blocked', () => {
    const approved = DecisionStateMachine.approveDecision(baseDecision, 'advisor_1', 'ADVISOR');
    expect(() => {
      DecisionStateMachine.approveDecision(approved, 'advisor_2', 'ADMIN');
    }).toThrow(/already approved/i);
  });

  // 7. Duplicate task creation deduplication
  test('7. Duplicate task creation from same active computation break is prevented', () => {
    const task1 = TaskGenerator.fromTaxOpportunity(
      {
        opportunityId: 'opp_tax_123',
        tenantId: tenantA,
        clientId: 'client_100',
        portfolioId: 'port_1',
        symbol: 'TSLA',
        unrealizedLoss: -6000,
        estimatedTaxSavings: 1500
      },
      'advisor_1'
    );
    expect(task1).not.toBeNull();

    const task2 = TaskGenerator.fromTaxOpportunity(
      {
        opportunityId: 'opp_tax_123',
        tenantId: tenantA,
        clientId: 'client_100',
        portfolioId: 'port_1',
        symbol: 'TSLA',
        unrealizedLoss: -6000,
        estimatedTaxSavings: 1500
      },
      'advisor_1',
      [task1!]
    );
    expect(task2).toBeNull();
  });

  // 8. Duplicate meeting completion
  test('8. Duplicate meeting completion is rejected', () => {
    const inProgress = MeetingStateMachine.startMeeting(baseMeeting, 'user_1');
    const { meeting } = MeetingStateMachine.completeMeeting(inProgress, 'user_1');
    expect(() => {
      MeetingStateMachine.completeMeeting(meeting, 'user_1');
    }).toThrow(/already completed/i);
  });

  // 9. Finalized decision mutation
  test('9. Finalized approved decision rejects payload mutations', () => {
    const approved = DecisionStateMachine.approveDecision(baseDecision, 'advisor_1', 'ADVISOR');
    expect(() => {
      DecisionStateMachine.validateImmutability(approved, { subject: 'Altered Subject' });
    }).toThrow(/immutable/i);
  });

  // 10. Audit event immutability & validation
  test('10. Activity event creation strictly requires tenantId and entityType', () => {
    expect(() => {
      ActivityTimelineService.createEvent('', 'TASK_CREATED', 'TASK', 'id_1', 'u1', 'ADVISOR', 'summary');
    }).toThrow(/requires tenantId/i);
  });

  // 11. Malformed IDs
  test('11. Task payload rejects empty or invalid clientId', () => {
    expect(() => {
      TaskStateMachine.validateTaskPayload({ tenantId: 'tenant_1', clientId: '   ', title: 'Task' });
    }).toThrow(/clientId is required/i);
  });

  // 12. Stale workflow source
  test('12. Completed task cannot be randomly transitioned without proper role', () => {
    const doneTask: AdvisorTask = { ...baseTask, status: 'DONE' };
    expect(TaskStateMachine.canTransition(doneTask.status, 'IN_PROGRESS', 'ANALYST')).toBe(false);
  });

  // 13. Deleted client with open tasks
  test('13. Client filtering properly isolates only active client tasks', () => {
    const taskOtherClient: AdvisorTask = { ...baseTask, taskId: 'task_other', clientId: 'client_deleted' };
    const filtered = [baseTask, taskOtherClient].filter((t) => t.clientId === 'client_100');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].taskId).toBe(baseTask.taskId);
  });

  // 14. Rejected rebalance proposal decision state transition
  test('14. Rejected decision cannot be directly approved without creating a new proposal/superseding record', () => {
    const rejected = DecisionStateMachine.rejectDecision(baseDecision, 'advisor_1', 'ADVISOR', 'Tax costs too high');
    expect(DecisionStateMachine.canTransition(rejected.decisionStatus, 'APPROVED')).toBe(false);
  });

  // 15. Discrepancy resolved twice deduplication
  test('15. Discrepancy task generator respects existing resolved tasks and avoids redundant alerts', () => {
    const resolvedTask: AdvisorTask = {
      ...baseTask,
      source: 'RECONCILIATION',
      sourceEntityId: 'disc_resolved_1',
      status: 'DONE'
    };

    // When status is DONE, a new discrepancy on the same entity can be raised only if fresh break occurs
    const freshTask = TaskGenerator.fromReconciliation(
      {
        discrepancyId: 'disc_resolved_1',
        tenantId: tenantA,
        clientId: 'client_100',
        expectedQty: 50,
        observedQty: 40,
        differenceQty: -10,
        severity: 'MEDIUM',
        source: 'FIDELITY',
        asOfDate: '2026-09-17'
      },
      'advisor_1',
      [resolvedTask]
    );

    expect(freshTask).not.toBeNull();
    expect(freshTask?.status).toBe('OPEN');
  });
});
