import {
  IndianTaxLot,
  TaxHarvestReport,
  PortfolioHolding,
} from "../types/wealth";
import {
  DEFAULT_INDIAN_TAX_RULESET,
  generateInstitutionalTaxReport,
  STATUTORY_TAX_DISCLAIMER,
} from "./tax";

export * from "./tax";

export const INDIAN_TAX_RATES = {
  STCG_EQUITY_PCT: DEFAULT_INDIAN_TAX_RULESET.rates.stcgEquityPct, // 20.0% (Section 111A)
  LTCG_EQUITY_PCT: DEFAULT_INDIAN_TAX_RULESET.rates.ltcgEquityPct, // 12.5% (Section 112A)
  LTCG_EXEMPTION_THRESHOLD: DEFAULT_INDIAN_TAX_RULESET.rates.ltcgExemptionLimit, // ₹1,25,000 annual exemption
  DEBT_SLAB_PCT: DEFAULT_INDIAN_TAX_RULESET.rates.debtMarginalRatePct, // 30.0% (Section 50AA)
};

export const STATUTORY_DISCLAIMER = STATUTORY_TAX_DISCLAIMER;

/**
 * Evaluates portfolio tax lots and produces an Indian tax harvesting report.
 * Powered by the institutional statutory engine in src/services/tax/
 */
export function generateTaxHarvestReport(
  holdings: PortfolioHolding[],
  realizedGains = { shortTerm: 0, longTerm: 0 },
  portfolioId = "default-portfolio"
): TaxHarvestReport {
  const institutionalReport = generateInstitutionalTaxReport(
    holdings,
    realizedGains,
    portfolioId
  );

  return {
    portfolioId: institutionalReport.portfolioId,
    assessmentYear: institutionalReport.assessmentYear,
    realizedGains: institutionalReport.realizedGains,
    unrealizedGains: institutionalReport.unrealizedGains,
    ltcgExemptionAvailable: institutionalReport.ltcgExemptionAvailable,
    ltcgExemptionUtilized: institutionalReport.ltcgExemptionUtilized,
    harvestCandidates: institutionalReport.harvestCandidates,
    totalHarvestableLoss: institutionalReport.totalHarvestableLoss,
    estimatedImmediateTaxSavings: institutionalReport.estimatedImmediateTaxSavings,
    netTaxLiability: institutionalReport.netTaxLiability,
    statutoryDisclaimer: institutionalReport.statutoryDisclaimer,
  };
}
