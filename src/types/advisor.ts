import {
  AppTab,
  Category,
  Client,
  Goal,
  PortfolioHolding,
  Priority,
  SmartAlert,
  SmartAlertSeverity,
  SmartAlertStatus,
} from "./wealth";

export type AdvisorActionType =
  | "PORTFOLIO_REVIEW"
  | "REBALANCE_REVIEW"
  | "TAX_REVIEW"
  | "GOAL_REVIEW"
  | "CLIENT_FOLLOWUP"
  | "REPORT_REVIEW"
  | "ALERT_REVIEW"
  | "KYC_REVIEW"
  | "COMMUNICATION"
  | "DATA_QUALITY";

export type AdvisorActionStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING"
  | "DONE"
  | "CANCELLED"
  | "SNOOZED";

export type AdvisorActionPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export interface PriorityScoreFactors {
  severity: number; // 1-5
  clientImportance: number; // 1-5
  financialImpact: number; // 1-5
  urgency: number; // 1-5
  dataConfidence: number; // 1-5
  explanation: string;
}

export interface ActionEvidence {
  metric: string;
  observedValue: number | string;
  threshold?: number | string;
  unit?: string;
  notes?: string;
}

export interface ActionDeepLink {
  tab: AppTab;
  screen?: string;
  params?: Record<string, any>;
  actionLabel?: string;
}

export interface AdvisorAction {
  id: string;
  canonicalKey: string; // Composite: clientId:sourceType:sourceId:actionType for deduplication
  clientId: string;
  clientName: string;
  portfolioId?: string;
  type: AdvisorActionType;
  priority: AdvisorActionPriority;
  priorityScore: number; // 0-100 deterministic explainable score
  priorityFactors: PriorityScoreFactors;
  severity?: "critical" | "warning" | "info";
  title: string;
  description: string;
  reason: string; // "Why this matters"
  evidence: ActionEvidence;
  createdAt: string;
  dueAt?: string;
  status: AdvisorActionStatus;
  sourceEngine:
    | "risk"
    | "tax"
    | "goals"
    | "attribution"
    | "health"
    | "reminders"
    | "data_quality";
  sourceMetric?: string;
  sourceValue?: number | string;
  sourceThreshold?: number | string;
  recommendedNextStep?: string;
  deepLink: ActionDeepLink;
  snoozedUntil?: string | null;
  completedAt?: string | null;
  notes?: string;
}

export type OpportunityType =
  | "TAX_HARVESTING"
  | "REBALANCING_DRIFT"
  | "GOAL_CATCH_UP"
  | "IDLE_CASH_DRAG"
  | "DATA_QUALITY_FIX"
  | "CLIENT_ANNUAL_REVIEW";

export interface AdvisorOpportunity {
  id: string;
  canonicalKey: string;
  clientId: string;
  clientName: string;
  portfolioId?: string;
  type: OpportunityType;
  title: string;
  description: string;
  potentialBenefit: string;
  estimatedFinancialValue?: number;
  evidence: ActionEvidence;
  recommendedAction: string;
  deepLink: ActionDeepLink;
  createdAt: string;
  priorityScore: number;
}

export interface AdvisorDecision {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  portfolioId?: string;
  issue: string;
  evidence: string;
  decision: string;
  rationale: string;
  advisorFollowUp: string;
  status: "RECORDED" | "PENDING_EXECUTION" | "EXECUTED";
  actionId?: string;
  createdAt: string;
}

export type AdvisorActivityType =
  | "PORTFOLIO_REVIEW"
  | "ALERT_CREATED"
  | "ALERT_RESOLVED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "REPORT_GENERATED"
  | "REPORT_APPROVED"
  | "REPORT_SHARED"
  | "CLIENT_MESSAGE"
  | "AI_ANALYSIS"
  | "TAX_REVIEW"
  | "GOAL_REVIEW"
  | "PORTFOLIO_UPDATED"
  | "DECISION_LOGGED"
  | "LOGIN";

export interface AdvisorActivity {
  id: string;
  clientId?: string;
  clientName?: string;
  type: AdvisorActivityType;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  metadata?: Record<string, any>;
}

export interface GroundedMetricClaim {
  sourceMetric: string;
  value: number | string;
  unit?: string;
  asOf: string;
  methodologyVersion?: string;
}

export interface AdvisorBrief {
  date: string;
  headline: string;
  summary: string;
  openCriticalAlerts: number;
  openHighPriorityTasks: number;
  clientsNeedingReview: number;
  goalWarnings: number;
  taxOpportunities: number;
  priorityActions: Array<{
    id: string;
    clientName: string;
    title: string;
    reason: string;
    recommendedNextStep: string;
  }>;
  marketContext: Array<{
    symbol: string;
    name: string;
    changePct: number;
    tone: "bullish" | "bearish" | "neutral";
  }>;
  clientTrends: string[];
  risks: string[];
  opportunities: string[];
  groundedClaims: GroundedMetricClaim[];
  methodologyVersion: string;
}

export interface Client360Snapshot {
  client: Client;
  portfolioValue: number;
  totalInvested: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPct: number;
  healthScore: number;
  healthGrade: string;
  goalsCount: number;
  goalsOnTrack: number;
  goalsAtRisk: number;
  riskProfile: string;
  currentDrawdownPct: number;
  taxHarvestPotential: number;
  openAlertsCount: number;
  criticalAlertsCount: number;
  openTasksCount: number;
  lastReviewDate: string;
  nextReviewDate: string;
  preferredChannel: string;
  recentActivities: AdvisorActivity[];
  nextAction?: AdvisorAction;
}

export interface MissingDataItem {
  id: string;
  clientId: string;
  clientName: string;
  holdingId?: string;
  holdingName?: string;
  missingField: string;
  issueDescription: string;
  recommendedAction: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
}

export interface DataQualityReport {
  overallScore: number; // 0-100%
  portfolioDataCompletenessPct: number;
  taxLotAcquisitionDateCoveragePct: number;
  historicalNavCoveragePct: number;
  benchmarkCoveragePct: number;
  missingItemsCount: number;
  missingItems: MissingDataItem[];
  asOfDate: string;
}

export interface WorkflowKpis {
  tasksCompletedToday: number;
  overdueTasksCount: number;
  clientReviewsCompletedThisMonth: number;
  reportsSentThisMonth: number;
  openAlertsCount: number;
  avgResolutionTimeHours: number;
}
