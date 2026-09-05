import { AssetClass, IndianTaxLot, PortfolioHolding } from "../../types/wealth";
import { HarvestOpportunity, InstitutionalTaxReport, TaxRuleSet } from "./types";
import { DEFAULT_INDIAN_TAX_RULESET, STATUTORY_TAX_DISCLAIMER, TAX_ENGINE_METHODOLOGY_VERSION } from "./taxRules";
import { evaluateTaxLots } from "./taxLots";
import { calculateStatutoryCapitalGainsTax } from "./taxCalculator";

export interface TaxHarvestOptions {
  ruleSet?: TaxRuleSet;
  asOfDate?: string;
}

/**
 * Optimizes tax lot loss harvesting aligned with statutory Indian set-off rules.
 */
export function generateInstitutionalTaxReport(
  holdings: PortfolioHolding[],
  realizedGains: { shortTerm: number; longTerm: number } = { shortTerm: 0, longTerm: 0 },
  portfolioId: string = "default-portfolio",
  options?: TaxHarvestOptions
): InstitutionalTaxReport {
  const ruleSet = options?.ruleSet || DEFAULT_INDIAN_TAX_RULESET;
  const asOfDate = options?.asOfDate || new Date().toISOString();
  const warnings: string[] = [];

  const harvestCandidates: IndianTaxLot[] = [];
  const harvestOpportunities: HarvestOpportunity[] = [];

  let totalHarvestableLoss = 0;
  let unrealizedSTGains = 0;
  let unrealizedLTGains = 0;
  let unrealizedSTLoss = 0;
  let unrealizedLTLoss = 0;

  holdings.forEach((holding) => {
    const lots = evaluateTaxLots(holding, ruleSet, asOfDate);

    lots.forEach((lot) => {
      const isLoss = lot.unrealizedGainLoss < 0;
      const absLoss = Math.abs(lot.unrealizedGainLoss);
      const isLT = lot.isLongTerm === true;
      const isST = lot.isLongTerm === false;
      const isUnverified = lot.isLongTerm === null;

      // Applicable statutory tax rate
      const applicableRate = isUnverified
        ? 0
        : lot.assetClass === "Stocks" || lot.assetClass === "Mutual Funds"
        ? isLT
          ? ruleSet.rates.ltcgEquityPct
          : ruleSet.rates.stcgEquityPct
        : ruleSet.rates.debtMarginalRatePct;

      if (!isLoss) {
        if (isLT) unrealizedLTGains += lot.unrealizedGainLoss;
        else if (isST) unrealizedSTGains += lot.unrealizedGainLoss;
      } else {
        totalHarvestableLoss += absLoss;
        if (isLT) unrealizedLTLoss += absLoss;
        else if (isST) unrealizedSTLoss += absLoss;

        const offsetCategory: "LTCG_ONLY" | "STCG_AND_LTCG" | "UNVERIFIED" = isUnverified
          ? "UNVERIFIED"
          : isLT
          ? "LTCG_ONLY"
          : "STCG_AND_LTCG";

        // Accurate marginal tax impact calculation
        // Short-term loss offsets 20% STCG first, then 12.5% LTCG
        // Long-term loss ONLY offsets 12.5% LTCG
        let estimatedImpact = 0;
        let rationale = "";

        if (isUnverified) {
          estimatedImpact = 0;
          rationale =
            "Statutory holding period cannot be verified due to missing or invalid acquisition date. Acquisition date required before tax shield can be estimated.";
        } else if (isST && realizedGains.shortTerm > 0) {
          // Offsets 20% STCG + 4% cess = 20.8% effective shield
          const offsetAmount = Math.min(absLoss, realizedGains.shortTerm);
          estimatedImpact = offsetAmount * (ruleSet.rates.stcgEquityPct / 100) * 1.04;
          rationale = `Can set off against ₹${Math.round(offsetAmount).toLocaleString("en-IN")} in realized STCG at 20% + 4% cess.`;
        } else if (isLT && realizedGains.longTerm > ruleSet.rates.ltcgExemptionLimit) {
          // Offsets 12.5% LTCG + 4% cess = 13% effective shield
          const taxableLTCG = realizedGains.longTerm - ruleSet.rates.ltcgExemptionLimit;
          const offsetAmount = Math.min(absLoss, taxableLTCG);
          estimatedImpact = offsetAmount * (ruleSet.rates.ltcgEquityPct / 100) * 1.04;
          rationale = `Can set off against taxable LTCG above ₹1.25L threshold at 12.5% + 4% cess.`;
        } else {
          // No current taxable gains: creates carry-forward loss shield (Section 74)
          estimatedImpact = 0;
          rationale =
            "No current-year taxable capital gains to offset. Harvesting preserves carry-forward loss eligibility for up to 8 assessment years (Section 74).";
        }

        harvestOpportunities.push({
          lotId: lot.lotId,
          holdingId: holding.id,
          ticker: lot.ticker,
          assetName: holding.assetName,
          assetClass: lot.assetClass,
          quantity: lot.quantity,
          acquiredAt: lot.acquiredAt,
          holdingPeriodMonths: lot.holdingPeriodMonths,
          isLongTerm: lot.isLongTerm,
          dateVerificationStatus: lot.dateVerificationStatus,
          unrealizedLoss: absLoss,
          offsetCategory,
          estimatedTaxImpact: parseFloat(estimatedImpact.toFixed(2)),
          confidence: isUnverified ? "INSUFFICIENT_DATA" : lot.quality,
          rationale,
          warnings: lot.warnings,
        });
      }

      // Legacy IndianTaxLot format compatibility
      harvestCandidates.push({
        holdingId: holding.id,
        assetName: holding.assetName,
        ticker: lot.ticker,
        assetClass: lot.assetClass,
        investedValue: lot.costBasis,
        currentValue: lot.currentValue,
        unrealizedGainLoss: lot.unrealizedGainLoss,
        holdingPeriodMonths: lot.holdingPeriodMonths ?? 0,
        isLongTerm: isLT,
        applicableTaxRatePct: applicableRate,
        isLossHarvestCandidate: isLoss,
        suggestedAction: isLoss
          ? isUnverified
            ? "VERIFY_DATE"
            : "HARVEST_LOSS"
          : lot.unrealizedGainLoss > 50000 && isLT
          ? "BOOK_PROFIT"
          : "HOLD",
        potentialTaxShield: isLoss && !isUnverified
          ? parseFloat(((absLoss * applicableRate) / 100).toFixed(2))
          : 0,
        washSaleWarning: isLoss, // GAAR / rebuy advisory
      });
    });
  });

  // Sort candidates by loss magnitude
  harvestCandidates.sort((a, b) => b.potentialTaxShield - a.potentialTaxShield);
  harvestOpportunities.sort((a, b) => b.unrealizedLoss - a.unrealizedLoss);

  // Compute Baseline Tax Liability (without harvesting)
  const baselineTax = calculateStatutoryCapitalGainsTax(
    {
      realizedSTCG: realizedGains.shortTerm,
      realizedLTCG: realizedGains.longTerm,
    },
    ruleSet
  );

  // Compute Post-Harvesting Tax Liability (simulating harvesting all unrealized losses)
  const postHarvestTax = calculateStatutoryCapitalGainsTax(
    {
      realizedSTCG: realizedGains.shortTerm,
      realizedLTCG: realizedGains.longTerm,
      realizedSTCL: unrealizedSTLoss,
      realizedLTCL: unrealizedLTLoss,
    },
    ruleSet
  );

  const genuineTaxSavings = Math.max(
    0,
    baselineTax.totalTaxLiability - postHarvestTax.totalTaxLiability
  );

  return {
    portfolioId,
    jurisdiction: "IN",
    assessmentYear: ruleSet.assessmentYear,
    financialYear: ruleSet.financialYear,
    realizedGains,
    unrealizedGains: {
      shortTerm: parseFloat(unrealizedSTGains.toFixed(2)),
      longTerm: parseFloat(unrealizedLTGains.toFixed(2)),
    },
    ltcgExemptionAvailable: baselineTax.ltcgExemptionAvailable,
    ltcgExemptionUtilized: baselineTax.ltcgExemptionUtilized,
    harvestCandidates,
    harvestOpportunities,
    totalHarvestableLoss: parseFloat(totalHarvestableLoss.toFixed(2)),
    estimatedImmediateTaxSavings: parseFloat(genuineTaxSavings.toFixed(2)),
    netTaxLiability: baselineTax.totalTaxLiability,
    methodologyVersion: TAX_ENGINE_METHODOLOGY_VERSION,
    statutoryDisclaimer: STATUTORY_TAX_DISCLAIMER,
    warnings,
  };
}
