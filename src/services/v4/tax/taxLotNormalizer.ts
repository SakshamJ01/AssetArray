/**
 * AssetArray 4.0 — Tax Lot Normalizer & Verification Subsystem
 * Integrates imported tax lot information with statutory Indian tax engine.
 * Ensures missing acquisition dates remain strictly UNVERIFIED (TAX_IMPACT_UNCERTAIN).
 */

import { CanonicalRecord, VerificationStatus } from "../../../types/v4/computation";

export interface NormalizedTaxLot {
  lotId: string;
  tenantId: string;
  symbol: string;
  securityName: string;
  quantity: number;
  costBasis: number;
  currentValue: number;
  acquisitionDate?: string;
  holdingPeriodMonths?: number;
  isLongTerm: boolean | null; // null if UNVERIFIED
  verificationStatus: VerificationStatus;
  source: string;
  unrealizedGainLoss: number;
  taxImpactStatus: "VERIFIED_STCG" | "VERIFIED_LTCG" | "VERIFIED_LOSS" | "TAX_IMPACT_UNCERTAIN";
}

export function normalizeTaxLotFromCanonical(record: CanonicalRecord): NormalizedTaxLot {
  const lotId = `lot-${record.canonicalId}`;
  const quantity = record.quantity || 1;
  const costBasis = record.investedAmount || record.currentValue;
  const currentValue = record.currentValue;
  const unrealizedGainLoss = currentValue - costBasis;

  const hasValidDate = record.acquisitionDate && !isNaN(Date.parse(record.acquisitionDate));
  const verificationStatus: VerificationStatus = hasValidDate ? "VERIFIED" : "UNVERIFIED";

  let holdingPeriodMonths: number | undefined;
  let isLongTerm: boolean | null = null;
  let taxImpactStatus: NormalizedTaxLot["taxImpactStatus"] = "TAX_IMPACT_UNCERTAIN";

  if (hasValidDate && record.acquisitionDate) {
    const acqTime = Date.parse(record.acquisitionDate);
    const nowTime = Date.now();
    const diffDays = (nowTime - acqTime) / (1000 * 60 * 60 * 24);
    holdingPeriodMonths = Math.floor(diffDays / 30.4375);

    // Statutory threshold for Equity: 12 months (365 days)
    isLongTerm = diffDays >= 365;

    if (unrealizedGainLoss < 0) {
      taxImpactStatus = "VERIFIED_LOSS";
    } else {
      taxImpactStatus = isLongTerm ? "VERIFIED_LTCG" : "VERIFIED_STCG";
    }
  } else {
    // Missing date: CANNOT infer holding period or tax impact
    holdingPeriodMonths = undefined;
    isLongTerm = null;
    taxImpactStatus = "TAX_IMPACT_UNCERTAIN";
  }

  return {
    lotId,
    tenantId: record.tenantId,
    symbol: record.symbol,
    securityName: record.securityName,
    quantity,
    costBasis,
    currentValue,
    acquisitionDate: hasValidDate ? record.acquisitionDate : undefined,
    holdingPeriodMonths,
    isLongTerm,
    verificationStatus,
    source: record.provenance.source,
    unrealizedGainLoss,
    taxImpactStatus,
  };
}
