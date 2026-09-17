import {
  AdvisorTask,
  AdvisorDecision,
  MeetingRecord,
  ActivityEvent,
  PrimaryNextAction,
  Client360WorkflowContext
} from '../../../types/v4/workflow';

export class Client360WorkflowService {
  /**
   * Deterministically calculates the single Primary Next Action for a client based on workflow state.
   */
  public static calculatePrimaryNextAction(
    tasks: AdvisorTask[],
    decisions: AdvisorDecision[],
    meetings: MeetingRecord[]
  ): PrimaryNextAction {
    const openTasks = tasks.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');

    // 1. Critical Priority items (e.g. custody breaks, major goal failure)
    const criticalTask = openTasks.find((t) => t.priority === 'CRITICAL');
    if (criticalTask) {
      if (criticalTask.source === 'RECONCILIATION') {
        return {
          actionType: 'REVIEW_RECONCILIATION',
          title: criticalTask.title,
          reason: criticalTask.description,
          urgency: 'CRITICAL',
          targetEntityType: 'RECONCILIATION',
          targetEntityId: criticalTask.sourceEntityId || criticalTask.taskId,
          associatedTaskId: criticalTask.taskId
        };
      }
      if (criticalTask.source === 'GOAL') {
        return {
          actionType: 'REVIEW_GOAL',
          title: criticalTask.title,
          reason: criticalTask.description,
          urgency: 'CRITICAL',
          targetEntityType: 'GOAL',
          targetEntityId: criticalTask.sourceEntityId || criticalTask.taskId,
          associatedTaskId: criticalTask.taskId
        };
      }
    }

    // 2. High Priority Rebalance Proposals requiring advisor review
    const rebalanceTask = openTasks.find(
      (t) => t.source === 'REBALANCE_PROPOSAL' && (t.priority === 'HIGH' || t.priority === 'CRITICAL')
    );
    if (rebalanceTask) {
      return {
        actionType: 'REVIEW_REBALANCE',
        title: rebalanceTask.title,
        reason: rebalanceTask.description,
        urgency: rebalanceTask.priority,
        targetEntityType: 'REBALANCE_PROPOSAL',
        targetEntityId: rebalanceTask.sourceEntityId || rebalanceTask.taskId,
        associatedTaskId: rebalanceTask.taskId
      };
    }

    // 3. Tax Harvesting Opportunities
    const taxTask = openTasks.find((t) => t.source === 'TAX');
    if (taxTask) {
      return {
        actionType: 'REVIEW_TAX_LOT',
        title: taxTask.title,
        reason: taxTask.description,
        urgency: taxTask.priority,
        targetEntityType: 'TAX',
        targetEntityId: taxTask.sourceEntityId || taxTask.taskId,
        associatedTaskId: taxTask.taskId
      };
    }

    // 4. Pending decisions needing sign-off
    const pendingDecision = decisions.find((d) => d.decisionStatus === 'PENDING_APPROVAL');
    if (pendingDecision) {
      return {
        actionType: 'REVIEW_REBALANCE',
        title: `Approve Decision: ${pendingDecision.subject}`,
        reason: pendingDecision.context,
        urgency: 'HIGH',
        targetEntityType: 'DECISION',
        targetEntityId: pendingDecision.decisionId
      };
    }

    // 5. Open Follow-up tasks
    const followUpTask = openTasks.find((t) => t.source === 'MEETING_FOLLOW_UP');
    if (followUpTask) {
      return {
        actionType: 'COMPLETE_FOLLOW_UP',
        title: followUpTask.title,
        reason: followUpTask.description,
        urgency: followUpTask.priority,
        targetEntityType: 'TASK',
        targetEntityId: followUpTask.taskId,
        associatedTaskId: followUpTask.taskId
      };
    }

    // 6. Generic open task fallback
    if (openTasks.length > 0) {
      const highestTask = [...openTasks].sort((a, b) => {
        const pMap: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      })[0];

      return {
        actionType: 'COMPLETE_FOLLOW_UP',
        title: highestTask.title,
        reason: highestTask.description,
        urgency: highestTask.priority,
        targetEntityType: 'TASK',
        targetEntityId: highestTask.taskId,
        associatedTaskId: highestTask.taskId
      };
    }

    // Honest empty state when all workflows are clear
    return {
      actionType: 'NONE',
      title: 'All Client Workflows Up to Date',
      reason: 'No open discrepancies, pending rebalance proposals, or urgent tasks.',
      urgency: 'LOW',
      targetEntityType: 'CLIENT',
      targetEntityId: ''
    };
  }

  /**
   * Aggregates full workflow context for a single client.
   */
  public static buildWorkflowContext(
    clientId: string,
    householdId: string | undefined,
    allTasks: AdvisorTask[],
    allDecisions: AdvisorDecision[],
    allMeetings: MeetingRecord[],
    allActivity: ActivityEvent[]
  ): Client360WorkflowContext {
    const clientTasks = allTasks.filter((t) => t.clientId === clientId);
    const clientDecisions = allDecisions.filter((d) => d.clientId === clientId);
    const clientMeetings = allMeetings.filter((m) => m.clientId === clientId);
    const clientActivity = allActivity.filter((a) => a.clientId === clientId);

    const openTasks = clientTasks.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
    const urgentItemsCount = openTasks.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH').length;
    const primaryNextAction = this.calculatePrimaryNextAction(clientTasks, clientDecisions, clientMeetings);

    return {
      clientId,
      householdId,
      primaryNextAction,
      openTasks,
      recentDecisions: clientDecisions.slice(-10),
      recentMeetings: clientMeetings.slice(-10),
      activityFeed: clientActivity.slice(0, 25),
      urgentItemsCount
    };
  }
}
