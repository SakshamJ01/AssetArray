import { TaskStateMachine } from '../src/services/v4/workflow/taskModel';
import { TaskGenerator } from '../src/services/v4/workflow/taskGenerator';
import { AdvisorTask, TaskStatus } from '../src/types/v4/workflow';

describe('V4 Phase 3 — Advisor Task Workflow & State Machine', () => {
  const baseTask: AdvisorTask = {
    taskId: 'task_001',
    tenantId: 'firm_alpha',
    clientId: 'client_101',
    title: 'Review Rebalance Strategy',
    description: 'Quarterly portfolio rebalance review',
    type: 'REBALANCE_REVIEW',
    priority: 'HIGH',
    status: 'OPEN',
    ownerUserId: 'advisor_john',
    createdBy: 'advisor_john',
    source: 'REBALANCE_PROPOSAL',
    sourceEntityId: 'prop_999',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  test('Permits legal state transition OPEN -> IN_PROGRESS', () => {
    const updated = TaskStateMachine.transitionTask(baseTask, 'IN_PROGRESS', 'advisor_john', 'ADVISOR');
    expect(updated.status).toBe('IN_PROGRESS');
  });

  test('Permits legal state transition IN_PROGRESS -> DONE with completion note', () => {
    const inProgressTask = { ...baseTask, status: 'IN_PROGRESS' as TaskStatus };
    const updated = TaskStateMachine.transitionTask(
      inProgressTask,
      'DONE',
      'advisor_john',
      'ADVISOR',
      'Completed review with client'
    );
    expect(updated.status).toBe('DONE');
    expect(updated.completedAt).toBeDefined();
    expect(updated.completionNote).toBe('Completed review with client');
  });

  test('Permits OPEN -> SNOOZED with valid snoozedUntil date', () => {
    const snoozeDate = new Date(Date.now() + 86400000).toISOString();
    const updated = TaskStateMachine.transitionTask(
      baseTask,
      'SNOOZED',
      'advisor_john',
      'ADVISOR',
      undefined,
      snoozeDate
    );
    expect(updated.status).toBe('SNOOZED');
    expect(updated.snoozedUntil).toBe(snoozeDate);
  });

  test('Fails to snooze without snoozedUntil date', () => {
    expect(() => {
      TaskStateMachine.transitionTask(baseTask, 'SNOOZED', 'advisor_john', 'ADVISOR');
    }).toThrow(/requires a valid snoozedUntil date/i);
  });

  test('Permits OPEN -> BLOCKED with block reason', () => {
    const updated = TaskStateMachine.transitionTask(
      baseTask,
      'BLOCKED',
      'advisor_john',
      'ADVISOR',
      'Waiting for client signed KYC doc'
    );
    expect(updated.status).toBe('BLOCKED');
    expect(updated.blockReason).toBe('Waiting for client signed KYC doc');
  });

  test('Prevents unauthorized reopening of DONE task by non-supervisor roles', () => {
    const doneTask = { ...baseTask, status: 'DONE' as TaskStatus };
    expect(TaskStateMachine.canTransition('DONE', 'OPEN', 'ANALYST')).toBe(false);
  });

  test('Permits supervisor/advisor role to reopen DONE task to OPEN', () => {
    expect(TaskStateMachine.canTransition('DONE', 'OPEN', 'ADMIN')).toBe(true);
    expect(TaskStateMachine.canTransition('DONE', 'OPEN', 'ADVISOR')).toBe(true);
  });

  test('Validates required fields in Task validation', () => {
    expect(() => {
      TaskStateMachine.validateTaskPayload({ tenantId: 'firm_1', clientId: '' });
    }).toThrow(/clientId is required/i);

    expect(() => {
      TaskStateMachine.validateTaskPayload({ tenantId: 'firm_1', clientId: 'c1', title: '' });
    }).toThrow(/title is required/i);
  });

  test('TaskGenerator generates task from Reconciliation discrepancy and retains source provenance', () => {
    const task = TaskGenerator.fromReconciliation(
      {
        discrepancyId: 'disc_789',
        tenantId: 'firm_alpha',
        clientId: 'client_101',
        portfolioId: 'port_55',
        holdingSymbol: 'AAPL',
        expectedQty: 100,
        observedQty: 90,
        differenceQty: -10,
        severity: 'HIGH',
        source: 'SCHWAB',
        asOfDate: '2026-09-17'
      },
      'advisor_john'
    );

    expect(task).not.toBeNull();
    expect(task!.source).toBe('RECONCILIATION');
    expect(task!.sourceEntityId).toBe('disc_789');
    expect(task!.evidence?.expectedValue).toBe(100);
    expect(task!.evidence?.observedValue).toBe(90);
    expect(task!.evidence?.discrepancyAmount).toBe(-10);
  });

  test('TaskGenerator deduplicates open discrepancy tasks', () => {
    const existingTask: AdvisorTask = {
      taskId: 'task_existing_1',
      tenantId: 'firm_alpha',
      clientId: 'client_101',
      title: 'Resolve Custody Discrepancy',
      description: 'Break',
      type: 'RECONCILIATION_REVIEW',
      priority: 'HIGH',
      status: 'OPEN',
      ownerUserId: 'advisor_john',
      createdBy: 'SYSTEM',
      source: 'RECONCILIATION',
      sourceEntityId: 'disc_789',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const duplicate = TaskGenerator.fromReconciliation(
      {
        discrepancyId: 'disc_789',
        tenantId: 'firm_alpha',
        clientId: 'client_101',
        expectedQty: 100,
        observedQty: 90,
        differenceQty: -10,
        severity: 'HIGH',
        source: 'SCHWAB',
        asOfDate: '2026-09-17'
      },
      'advisor_john',
      [existingTask]
    );

    expect(duplicate).toBeNull();
  });
});
