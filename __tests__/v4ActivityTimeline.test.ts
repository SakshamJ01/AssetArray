import { ActivityTimelineService } from '../src/services/v4/workflow/activityService';
import { Client360WorkflowService } from '../src/services/v4/workflow/client360Workflow';
import { ActivityEvent, AdvisorTask, AdvisorDecision, MeetingRecord } from '../src/types/v4/workflow';

describe('V4 Phase 3 — Activity Timeline & Client 360 Workflow Intelligence', () => {
  const tenantId = 'firm_alpha';
  const clientId = 'client_101';

  test('Creates and filters activity events by tenant and client', () => {
    const e1 = ActivityTimelineService.createEvent(
      tenantId,
      'TASK_CREATED',
      'TASK',
      'task_1',
      'advisor_1',
      'ADVISOR',
      'Created task',
      { clientId }
    );

    const e2 = ActivityTimelineService.createEvent(
      'firm_other',
      'TASK_CREATED',
      'TASK',
      'task_2',
      'advisor_2',
      'ADVISOR',
      'Other tenant task',
      { clientId: 'client_other' }
    );

    const filtered = ActivityTimelineService.filterTimeline([e1, e2], tenantId, { clientId });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].entityId).toBe('task_1');
    expect(filtered[0].tenantId).toBe(tenantId);
  });

  test('Client 360 calculates single Primary Next Action prioritizing critical custody breaks', () => {
    const criticalReconTask: AdvisorTask = {
      taskId: 'task_recon_1',
      tenantId,
      clientId,
      title: 'Resolve Custody Discrepancy: AAPL',
      description: 'Position break of -10 shares on custodian Schwab',
      type: 'RECONCILIATION_REVIEW',
      priority: 'CRITICAL',
      status: 'OPEN',
      ownerUserId: 'advisor_1',
      createdBy: 'SYSTEM',
      source: 'RECONCILIATION',
      sourceEntityId: 'recon_break_99',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextAction = Client360WorkflowService.calculatePrimaryNextAction([criticalReconTask], [], []);
    expect(nextAction.actionType).toBe('REVIEW_RECONCILIATION');
    expect(nextAction.urgency).toBe('CRITICAL');
    expect(nextAction.targetEntityId).toBe('recon_break_99');
  });

  test('Client 360 calculates rebalance proposal action when no critical breaks exist', () => {
    const rebalTask: AdvisorTask = {
      taskId: 'task_rebal_1',
      tenantId,
      clientId,
      title: 'Review Rebalance Proposal (Drift: 18%)',
      description: 'Proposal with 4 trades',
      type: 'REBALANCE_REVIEW',
      priority: 'HIGH',
      status: 'OPEN',
      ownerUserId: 'advisor_1',
      createdBy: 'SYSTEM',
      source: 'REBALANCE_PROPOSAL',
      sourceEntityId: 'prop_55',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextAction = Client360WorkflowService.calculatePrimaryNextAction([rebalTask], [], []);
    expect(nextAction.actionType).toBe('REVIEW_REBALANCE');
    expect(nextAction.urgency).toBe('HIGH');
  });

  test('Client 360 returns honest empty state when all workflows are clear', () => {
    const nextAction = Client360WorkflowService.calculatePrimaryNextAction([], [], []);
    expect(nextAction.actionType).toBe('NONE');
    expect(nextAction.title).toBe('All Client Workflows Up to Date');
  });
});
