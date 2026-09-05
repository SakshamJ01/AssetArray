/**
 * Institutional Client Insight Engine — Type Definitions
 * Strict change detection, snapshot schemas, and evidence models.
 */

export type SnapshotEntityType = "PORTFOLIO" | "METRIC" | "GOAL" | "HEALTH";

export interface HistoricalSnapshot {
  id: string;
  entityId: string; // e.g. clientId or goalId
  entityType: SnapshotEntityType;
  metric: string; // e.g. "total_aum", "health_score", "equity_weight", "goal_probability", "drawdown_pct", "cash_pct"
  value: number;
  metadata?: Record<string, any>;
  timestamp: string;
  source: string;
  methodologyVersion: string;
}

export type InsightType =
  | "CONCENTRATION_CHANGE"
  | "ALLOCATION_DRIFT"
  | "PERFORMANCE_DEVIATION"
  | "HEALTH_DETERIORATION"
  | "GOAL_DETERIORATION"
  | "DRAWDOWN_CHANGE"
  | "CASH_DRAG"
  | "TAX_OPPORTUNITY"
  | "LIQUIDITY_CHANGE"
  | "DATA_QUALITY"
  | "SERVICE_GAP";

export interface InsightEvidence {
  current: number;
  previous: number;
  delta: number;
  unit?: string;
  periodDays: number;
  source: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  threshold?: number;
}

export interface InsightExplanation {
  explanation: string;
  whyItMatters: string;
  advisorQuestions: string[];
  possibleActions: string[];
}

export interface ClientInsight {
  id: string;
  clientId: string;
  clientName: string;
  type: InsightType;
  title: string;
  summary: string;
  evidence: InsightEvidence;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  detectedAt: string;
  explanation?: InsightExplanation;
}
