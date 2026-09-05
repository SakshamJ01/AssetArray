import { TaxRuleSet } from "./types";
import { DEFAULT_INDIAN_TAX_RULESET } from "./taxRules";

export interface CapitalGainsInput {
  realizedSTCG: number;
  realizedLTCG: number;
  realizedSTCL?: number; // Short-term capital loss to set off
  realizedLTCL?: number; // Long-term capital loss to set off
}

export interface TaxCalculationResult {
  grossSTCG: number;
  grossLTCG: number;
  stclUtilizedAgainstSTCG: number;
  stclUtilizedAgainstLTCG: number;
  ltclUtilizedAgainstLTCG: number;
  unabsorbedSTCL: number;
  unabsorbedLTCL: number;
  netSTCG: number;
  netLTCGPreExemption: number;
  ltcgExemptionAvailable: number;
  ltcgExemptionUtilized: number;
  taxableLTCG: number;
  taxableSTCG: number;
  stcgTaxAmount: number;
  ltcgTaxAmount: number;
  baseTaxAmount: number;
  cessAmount: number;
  totalTaxLiability: number;
  rulesApplied: {
    stcgRatePct: number;
    ltcgRatePct: number;
    cessPct: number;
    financialYear: string;
  };
}

/**
 * Calculates Indian Capital Gains Tax following strict Section 70/74 set-off hierarchy.
 *
 * Statutory Hierarchy:
 * 1. LTCL can ONLY set off LTCG. (Cannot touch STCG)
 * 2. STCL can set off STCG first, and remaining STCL can set off LTCG.
 * 3. Section 112A ₹1,25,000 exemption applies to net LTCG.
 * 4. 4% Health & Education Cess applies on total tax.
 */
export function calculateStatutoryCapitalGainsTax(
  gains: CapitalGainsInput,
  ruleSet: TaxRuleSet = DEFAULT_INDIAN_TAX_RULESET
): TaxCalculationResult {
  const grossSTCG = Math.max(0, gains.realizedSTCG || 0);
  const grossLTCG = Math.max(0, gains.realizedLTCG || 0);
  const availableSTCL = Math.abs(gains.realizedSTCL || 0);
  const availableLTCL = Math.abs(gains.realizedLTCL || 0);

  // Step 1: Set off LTCL against LTCG only
  const ltclUtilizedAgainstLTCG = Math.min(availableLTCL, grossLTCG);
  const remainingLTCGAfterLTCL = grossLTCG - ltclUtilizedAgainstLTCG;
  const unabsorbedLTCL = availableLTCL - ltclUtilizedAgainstLTCG;

  // Step 2: Set off STCL against STCG first
  const stclUtilizedAgainstSTCG = Math.min(availableSTCL, grossSTCG);
  const remainingSTCG = grossSTCG - stclUtilizedAgainstSTCG;
  let remainingSTCL = availableSTCL - stclUtilizedAgainstSTCG;

  // Step 3: Set off remaining STCL against remaining LTCG
  const stclUtilizedAgainstLTCG = Math.min(remainingSTCL, remainingLTCGAfterLTCL);
  const netLTCGPreExemption = remainingLTCGAfterLTCL - stclUtilizedAgainstLTCG;
  const unabsorbedSTCL = remainingSTCL - stclUtilizedAgainstLTCG;

  const netSTCG = remainingSTCG;

  // Step 4: Section 112A ₹1,25,000 LTCG Exemption
  const exemptionLimit = ruleSet.rates.ltcgExemptionLimit;
  const ltcgExemptionUtilized = Math.min(netLTCGPreExemption, exemptionLimit);
  const taxableLTCG = Math.max(0, netLTCGPreExemption - exemptionLimit);
  const taxableSTCG = netSTCG;

  // Step 5: Tax computations with statutory rates
  const stcgRate = ruleSet.rates.stcgEquityPct / 100; // 20%
  const ltcgRate = ruleSet.rates.ltcgEquityPct / 100; // 12.5%
  const cessRate = ruleSet.rates.cessPct / 100; // 4%

  const stcgTaxAmount = parseFloat((taxableSTCG * stcgRate).toFixed(2));
  const ltcgTaxAmount = parseFloat((taxableLTCG * ltcgRate).toFixed(2));
  const baseTaxAmount = parseFloat((stcgTaxAmount + ltcgTaxAmount).toFixed(2));

  const cessAmount = parseFloat((baseTaxAmount * cessRate).toFixed(2));
  const totalTaxLiability = parseFloat((baseTaxAmount + cessAmount).toFixed(2));

  return {
    grossSTCG,
    grossLTCG,
    stclUtilizedAgainstSTCG,
    stclUtilizedAgainstLTCG,
    ltclUtilizedAgainstLTCG,
    unabsorbedSTCL,
    unabsorbedLTCL,
    netSTCG,
    netLTCGPreExemption,
    ltcgExemptionAvailable: exemptionLimit,
    ltcgExemptionUtilized,
    taxableLTCG,
    taxableSTCG,
    stcgTaxAmount,
    ltcgTaxAmount,
    baseTaxAmount,
    cessAmount,
    totalTaxLiability,
    rulesApplied: {
      stcgRatePct: ruleSet.rates.stcgEquityPct,
      ltcgRatePct: ruleSet.rates.ltcgEquityPct,
      cessPct: ruleSet.rates.cessPct,
      financialYear: ruleSet.financialYear,
    },
  };
}
