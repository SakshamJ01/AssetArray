/**
 * AssetArray V4.0 — Phase 4 Grounded AI & Advisor Copilot
 * Type definitions for AI Context, Grounding, Schemas, Claim Verification, and Provider Routing.
 */

export type V4AiTaskType =
  | 'ADVISOR_BRIEF'
  | 'MEETING_BRIEF'
  | 'PORTFOLIO_EXPLANATION'
  | 'TAX_EXPLANATION'
  | 'REBALANCE_EXPLANATION'
  | 'RESEARCH_SUMMARY'
  | 'CLIENT_SUMMARY'
  | 'CLIENT_COMMUNICATION_DRAFT'
  | 'DECISION_CHALLENGE'
  | 'RISK_EXPLANATION';

export type ClaimType =
  | 'VERIFIED_NUMERIC'
  | 'VERIFIED_FACT'
  | 'SOURCE_DERIVED'
  | 'MODEL_INTERPRETATION'
  | 'MODEL_SUGGESTION'
  | 'UNSUPPORTED';

export type AiConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_EVIDENCE';

export type V4StreamState =
  | 'IDLE'
  | 'CONNECTING'
  | 'THINKING'
  | 'STREAMING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'UNAVAILABLE';

export interface EvidenceLink {
  sourceType: string;
  sourceId: string;
  metric?: string;
  value?: string | number;
  unit?: string;
  asOf?: string;
  methodology?: string;
  urlOrCitation?: string;
}

export interface ClaimVerification {
  id: string;
  claimText: string;
  claimType: ClaimType;
  confidence: AiConfidence;
  evidenceLinks: EvidenceLink[];
  isGrounded: boolean;
  unsupportedReason?: string;
}

export interface AiContextSnapshot {
  snapshotId: string;
  tenantId: string;
  clientId?: string;
  householdId?: string;
  portfolioId?: string;
  taskType: V4AiTaskType;
  contextAsOf: string;
  version: number;
  // Data-minimized sections
  clientSnapshot?: {
    name: string;
    riskCategory?: string;
    lifecycleStage?: string;
    taxStatus?: string;
  };
  portfolioSnapshot?: {
    totalAUM: number;
    currency: string;
    healthScore?: number;
    driftScore?: number;
    topHoldingsSummary?: { symbol: string; weightPct: number; gainLossPct?: number }[];
    assetAllocation?: Record<string, number>;
  };
  riskSnapshot?: {
    riskScore?: number;
    var95?: number;
    cvar95?: number;
    beta?: number;
    sharpeRatio?: number;
  };
  taxSnapshot?: {
    unrealizedGains?: number;
    unrealizedLosses?: number;
    harvestableLosses?: number;
    shortTermLiabilityEst?: number;
    longTermLiabilityEst?: number;
  };
  workflowSnapshot?: {
    openTasksCount?: number;
    criticalAlertsCount?: number;
    pendingDecisionsCount?: number;
    lastMeetingDate?: string;
    openTaskTitles?: string[];
  };
  researchEvidence?: {
    sourceId: string;
    title: string;
    asOfDate: string;
    isCurrent: boolean;
    keyFacts: string[];
  }[];
  untrustedTextBlocks?: {
    field: string;
    sanitizedContent: string;
  }[];
}

// Structured Output Schemas
export interface BaseAiOutput {
  taskType: V4AiTaskType;
  snapshotId: string;
  confidence: AiConfidence;
  claims: ClaimVerification[];
  limitations: string[];
  suggestedActions: string[];
  requiresHumanReview: boolean;
  disclaimer: string;
}

export interface AdvisorExplanation extends BaseAiOutput {
  topic: string;
  summary: string;
  detailedExplanation: string;
  keyDrivers: string[];
}

export interface MeetingBriefSection {
  title: string;
  keyPoints: string[];
  evidenceReferences: string[];
}

export interface MeetingBrief extends BaseAiOutput {
  clientId: string;
  clientOverview: string;
  portfolioChanges: MeetingBriefSection;
  riskExceptions: MeetingBriefSection;
  taxOpportunities: MeetingBriefSection;
  goalsReview: MeetingBriefSection;
  suggestedDiscussionTopics: string[];
  recommendedFollowUps: string[];
}

export interface ResearchSummary extends BaseAiOutput {
  query: string;
  entityName?: string;
  isEntityVerified: boolean;
  currentVsHistorical: {
    currentFacts: string[];
    historicalContext: string[];
  };
  thesisSynthesis: string;
  citations: string[];
}

export interface DecisionChallenge extends BaseAiOutput {
  thesis: string;
  supportingEvidence: string[];
  counterEvidence: string[];
  missingInformation: string[];
  probingQuestions: string[];
}

export interface ClientCommunicationDraft extends BaseAiOutput {
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'MEMO';
  subject?: string;
  draftBody: string;
  audienceContext: string;
  talkingPoints: string[];
}
