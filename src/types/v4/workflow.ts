/**
 * AssetArray V4.0 — Phase 3 Advisor Workflow Layer
 * Type definitions for Tasks, Decisions, Meeting Workspace, and Activity Timeline.
 */

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED' | 'SNOOZED';
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskSourceType = 
  | 'ALERT' 
  | 'RECONCILIATION' 
  | 'REBALANCE_PROPOSAL' 
  | 'GOAL' 
  | 'TAX' 
  | 'CLIENT_REVIEW' 
  | 'MANUAL'
  | 'MEETING_FOLLOW_UP';

export interface TaskEvidence {
  sourceType: TaskSourceType;
  sourceId: string;
  metric?: string;
  discrepancyAmount?: number;
  expectedValue?: string | number;
  observedValue?: string | number;
  asOfDate?: string;
  details?: Record<string, unknown>;
}

export interface AdvisorTask {
  taskId: string;
  tenantId: string;
  clientId: string;
  householdId?: string;
  portfolioId?: string;
  title: string;
  description: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  ownerUserId: string;
  createdBy: string;
  dueAt?: string;
  source: TaskSourceType;
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

export type DecisionStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
export type DecisionType = 
  | 'REBALANCE' 
  | 'TAX_HARVEST' 
  | 'GOAL_ADJUSTMENT' 
  | 'RISK_PROFILE_CHANGE' 
  | 'HOLDING_EXCEPTION' 
  | 'MEETING_ACTION' 
  | 'CLIENT_REVIEW';

export interface DecisionEvidence {
  sourceType: string;
  sourceId: string;
  proposalData?: Record<string, unknown>;
  taxImpact?: {
    estimatedGainsRealized?: number;
    estimatedLossesRealized?: number;
    estimatedTaxLiability?: number;
  };
  riskImpact?: {
    priorRiskScore?: number;
    targetRiskScore?: number;
    postTradeRiskScore?: number;
  };
  driftDetails?: Record<string, unknown>;
  reconciliationDiscrepancy?: Record<string, unknown>;
}

export interface AdvisorDecision {
  decisionId: string;
  tenantId: string;
  clientId: string;
  householdId?: string;
  portfolioId?: string;
  decisionType: DecisionType;
  subject: string;
  context: string;
  evidence: DecisionEvidence;
  beforeState: Record<string, unknown>;
  proposedAction: Record<string, unknown>;
  decision: 'APPROVE' | 'REJECT' | 'DEFER';
  decisionStatus: DecisionStatus;
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MeetingAgendaItem {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

export interface MeetingNote {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface MeetingWorkspaceSnapshot {
  clientOverview: {
    name: string;
    householdName?: string;
    totalAUM: number;
    riskProfile?: string;
  };
  openTasksCount: number;
  criticalAlertsCount: number;
  recentActivitySummary: string[];
  portfolioDriftDetected: boolean;
  taxHarvestOpportunitiesCount: number;
  goalsNeedingReviewCount: number;
}

export interface MeetingRecord {
  meetingId: string;
  tenantId: string;
  clientId: string;
  householdId?: string;
  title: string;
  status: MeetingStatus;
  participants: string[];
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  agenda: MeetingAgendaItem[];
  preMeetingSnapshot?: MeetingWorkspaceSnapshot;
  notes: MeetingNote[];
  decisions: string[]; // decision IDs
  tasks: string[]; // task IDs created as follow-ups
  createdAt: string;
  updatedAt: string;
}

export type ActivityEventType =
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'PORTFOLIO_UPDATED'
  | 'HOLDING_UPDATED'
  | 'INGESTION_COMPLETED'
  | 'RECONCILIATION_OPENED'
  | 'RECONCILIATION_RESOLVED'
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_COMPLETED'
  | 'MEETING_SCHEDULED'
  | 'MEETING_STARTED'
  | 'MEETING_COMPLETED'
  | 'MEETING_CANCELLED'
  | 'DECISION_CREATED'
  | 'DECISION_APPROVED'
  | 'DECISION_REJECTED';

export interface ActivityEvent {
  eventId: string;
  tenantId: string;
  eventType: ActivityEventType;
  entityType: 'CLIENT' | 'HOUSEHOLD' | 'PORTFOLIO' | 'TASK' | 'DECISION' | 'MEETING' | 'RECONCILIATION' | 'REBALANCE';
  entityId: string;
  clientId?: string;
  householdId?: string;
  portfolioId?: string;
  actorId: string;
  actorRole: string;
  timestamp: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface PrimaryNextAction {
  actionType: 'REVIEW_RECONCILIATION' | 'REVIEW_REBALANCE' | 'REVIEW_TAX_LOT' | 'REVIEW_GOAL' | 'COMPLETE_FOLLOW_UP' | 'SCHEDULE_REVIEW' | 'NONE';
  title: string;
  reason: string;
  urgency: TaskPriority;
  targetEntityType: string;
  targetEntityId: string;
  associatedTaskId?: string;
}

export interface Client360WorkflowContext {
  clientId: string;
  householdId?: string;
  primaryNextAction: PrimaryNextAction;
  openTasks: AdvisorTask[];
  recentDecisions: AdvisorDecision[];
  recentMeetings: MeetingRecord[];
  activityFeed: ActivityEvent[];
  urgentItemsCount: number;
}
