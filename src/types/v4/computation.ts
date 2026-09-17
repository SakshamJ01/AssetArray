/**
 * AssetArray 4.0 — Phase 2: Computation Layer Domain Models & Interfaces
 */

export type IngestionSourceType =
  | "MANUAL_GRID"
  | "BROKER_CSV"
  | "STATEMENT_TEXT"
  | "CAMS_CAS"
  | "KFINTECH_CAS"
  | "NSDL_CAS"
  | "CDSL_CAS"
  | "UNSUPPORTED";

export type IngestionJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type VerificationStatus = "VERIFIED" | "UNVERIFIED";

export type DataQualityState =
  | "COMPLETE"
  | "PARTIAL"
  | "STALE"
  | "MISSING"
  | "UNVERIFIED";

export interface ProvenanceRecord {
  source: string;
  sourceRecordId?: string;
  ingestionJobId: string;
  asOf: string;
  method: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
  originalValue?: any;
}

export interface RawSourceRecord {
  recordId: string;
  rawFields: Record<string, any>;
  sourceLineNumber?: number;
}

export interface CanonicalRecord {
  canonicalId: string;
  tenantId: string;
  accountNumber?: string;
  symbol: string;
  securityName: string;
  isin?: string;
  quantity: number;
  price: number;
  investedAmount: number;
  currentValue: number;
  transactionDate?: string;
  acquisitionDate?: string;
  currency: string;
  assetClass: "Equity" | "Fixed Income" | "Mutual Fund" | "Commodities" | "Alternatives" | "Cash";
  provenance: ProvenanceRecord;
  qualityState: DataQualityState;
  unmappedFields: string[];
}

export interface ValidationIssue {
  code: string;
  field?: string;
  message: string;
  severity: "ERROR" | "WARNING";
  recordId?: string;
}

export interface IngestionJob {
  jobId: string;
  tenantId: string;
  sourceType: IngestionSourceType;
  sourceName: string;
  status: IngestionJobStatus;
  startedAt: string;
  completedAt?: string;
  recordCounts: {
    totalRaw: number;
    accepted: number;
    rejected: number;
    unmapped: number;
  };
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  provenance: {
    fingerprint: string;
    createdBy: string;
    clientIp?: string;
  };
  createdBy: string;
  records?: CanonicalRecord[];
}

export type DiscrepancyType =
  | "QUANTITY_MISMATCH"
  | "VALUE_MISMATCH"
  | "CASH_MISMATCH"
  | "MISSING_POSITION"
  | "UNEXPECTED_POSITION"
  | "DUPLICATE_RECORD"
  | "TRANSACTION_MISMATCH"
  | "TAX_LOT_MISMATCH"
  | "CORPORATE_ACTION_MISMATCH";

export type DiscrepancySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type DiscrepancyStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "IGNORED";

export interface ReconciliationDiscrepancy {
  discrepancyId: string;
  tenantId: string;
  entity: {
    portfolioId: string;
    symbol?: string;
    securityName?: string;
    holdingId?: string;
  };
  type: DiscrepancyType;
  expected: any;
  observed: any;
  difference: any;
  source: string;
  severity: DiscrepancySeverity;
  status: DiscrepancyStatus;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  requiresCorporateActionReview?: boolean;
}

export interface DriftCorridorConfig {
  assetClass: string;
  targetWeightPct: number; // 0 - 100
  lowerBandPct: number; // e.g. 5.0 (tolerance band below target)
  upperBandPct: number; // e.g. 5.0 (tolerance band above target)
}

export interface RebalanceCandidate {
  securitySymbol: string;
  securityName: string;
  assetClass: string;
  action: "BUY" | "SELL" | "NO_ACTION";
  currentWeightPct: number;
  targetWeightPct: number;
  weightDeltaPct: number;
  estimatedValueDelta: number;
  taxLotsAffectedCount: number;
  estimatedTaxImpact: number | "TAX_IMPACT_UNCERTAIN";
  dataQuality: DataQualityState;
  rationale: string;
}

export interface RebalanceProposalComparison {
  portfolioId: string;
  tenantId: string;
  asOf: string;
  currentAllocation: Record<string, { weightPct: number; value: number }>;
  proposedAllocation: Record<string, { weightPct: number; value: number }>;
  candidates: RebalanceCandidate[];
  estimatedTurnoverValue: number;
  estimatedTaxImpactTotal: number | "TAX_IMPACT_UNCERTAIN";
  concentrationChange: {
    topSecurityCurrentWeightPct: number;
    topSecurityProposedWeightPct: number;
  };
  riskChangeSummary: {
    status: "STABLE" | "REDUCED_DRIFT" | "UNCERTAIN";
    maxDriftBeforePct: number;
    maxDriftAfterPct: number;
  };
  isImmutable: true;
}
