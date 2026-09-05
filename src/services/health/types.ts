import {
  HealthScoreFactors,
  HealthScoreResult,
  PortfolioHolding,
  Goal,
  DataQualityState,
} from "../../types/wealth";

export interface HealthEvidencePoint {
  metric: string;
  value: number | string;
  target?: number | string;
  unit?: string;
}

export interface FactorScoreResult {
  factorId: string;
  name: string;
  score: number; // 0 - 100
  weight: number; // e.g. 0.20
  inputs: Record<string, number | string | boolean>;
  explanation: string;
  confidence: DataQualityState;
  recommendations: string[];
  evidence: HealthEvidencePoint[];
}

export interface HealthScoreConfig {
  weights?: {
    dataQuality?: number;
    assetDiversification?: number;
    concentration?: number;
    geographicExposure?: number;
    currencyExposure?: number;
    liquidity?: number;
    liability?: number;
    goalAlignment?: number;
  };
  concentrationThreshold?: number; // default: 0.15 (15%)
  top3Threshold?: number; // default: 0.45 (45%)
  recommendedCashRatio?: number; // default: 0.05 to 0.15
  maxDebtRatio?: number; // default: 0.35 (35%)
}

export interface InstitutionalHealthScoreResult extends HealthScoreResult {
  confidence: DataQualityState;
  explanation: string;
  evidence: HealthEvidencePoint[];
  detailedFactors: FactorScoreResult[];
  methodologyVersion: string;
}
