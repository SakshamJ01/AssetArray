import { AssetClass, DataQualityState, IndianTaxLot, TaxLot } from "../../types/wealth";

export interface HoldingPeriodRule {
  assetClass: AssetClass;
  isListed: boolean;
  thresholdMonths: number; // 12 for listed equity, 24 for unlisted, 36 for legacy debt
}

export interface StatutoryTaxRates {
  stcgEquityPct: number; // 20% (Section 111A, Finance Act 2024)
  ltcgEquityPct: number; // 12.5% (Section 112A, Finance Act 2024)
  ltcgExemptionLimit: number; // ₹1,25,000 per financial year (Section 112A)
  debtMarginalRatePct: number; // 30% slab (Section 50AA)
  surchargePct: number; // e.g. 0% default
  cessPct: number; // 4% Health & Education Cess
}

export interface TaxRuleSet {
  jurisdiction: "IN";
  financialYear: string; // e.g. "2025-26"
  assessmentYear: string; // e.g. "AY 2026-27"
  effectiveFrom: string;
  effectiveTo: string;
  source: string;
  lastVerified: string;
  rates: StatutoryTaxRates;
  holdingPeriodRules: HoldingPeriodRule[];
}

export interface TaxLotCalculationResult {
  lotId: string;
  securityId: string;
  ticker: string;
  assetClass: AssetClass;
  quantity: number;
  acquiredAt: string;
  costBasis: number;
  currentValue: number;
  unrealizedGainLoss: number;
  holdingPeriodMonths: number | null;
  isLongTerm: boolean | null;
  dateVerificationStatus: "DATE_VERIFIED" | "DATE_MISSING" | "DATE_INVALID" | "LEGACY_ESTIMATE";
  quality: DataQualityState;
  warnings: string[];
}

export interface HarvestOpportunity {
  lotId: string;
  holdingId: string;
  ticker: string;
  assetName: string;
  assetClass: AssetClass;
  quantity: number;
  acquiredAt: string;
  holdingPeriodMonths: number | null;
  isLongTerm: boolean | null;
  dateVerificationStatus: "DATE_VERIFIED" | "DATE_MISSING" | "DATE_INVALID" | "LEGACY_ESTIMATE";
  unrealizedLoss: number;
  offsetCategory: "LTCG_ONLY" | "STCG_AND_LTCG" | "UNVERIFIED";
  estimatedTaxImpact: number;
  confidence: DataQualityState;
  rationale: string;
  warnings: string[];
}

export interface InstitutionalTaxReport {
  portfolioId: string;
  jurisdiction: "IN";
  assessmentYear: string;
  financialYear: string;
  realizedGains: {
    shortTerm: number;
    longTerm: number;
  };
  unrealizedGains: {
    shortTerm: number;
    longTerm: number;
  };
  ltcgExemptionAvailable: number;
  ltcgExemptionUtilized: number;
  harvestCandidates: IndianTaxLot[];
  harvestOpportunities: HarvestOpportunity[];
  totalHarvestableLoss: number;
  estimatedImmediateTaxSavings: number;
  netTaxLiability: number;
  methodologyVersion: string;
  statutoryDisclaimer: string;
  warnings: string[];
}
