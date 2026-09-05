import {
  IndianTaxLot,
  TaxHarvestReport,
  PortfolioHolding,
} from "../types/wealth";

export const INDIAN_TAX_RATES = {
  STCG_EQUITY_PCT: 20.0, // Section 111A
  LTCG_EQUITY_PCT: 12.5, // Section 112A (Finance Act 2024)
  LTCG_EXEMPTION_THRESHOLD: 125000, // ₹1,25,000 annual exemption limit
  DEBT_SLAB_PCT: 30.0, // Marginal slab rate for debt mutual funds
};

export const STATUTORY_DISCLAIMER =
  "Tax projections are computed under the provisions of the Indian Income Tax Act, 1961 (as amended by Finance Act 2024 / FY 2025-26). All loss-harvesting suggestions are non-binding estimates. Consult a certified Chartered Accountant (CA) or Tax Professional prior to trade execution.";

/**
 * Evaluates portfolio tax lots and produces an Indian tax harvesting report
 */
export function generateTaxHarvestReport(
  holdings: PortfolioHolding[],
  realizedGains = { shortTerm: 0, longTerm: 0 },
  portfolioId = "default-portfolio"
): TaxHarvestReport {
  const lots: IndianTaxLot[] = [];
  let totalHarvestableLoss = 0;
  let estimatedImmediateTaxSavings = 0;

  let unrealizedSTGains = 0;
  let unrealizedLTGains = 0;

  holdings.forEach((h, index) => {
    const cur = Number(h.currentValue) || 0;
    const inv = Number(h.investedValue) || 0;
    const gainLoss = cur - inv;

    // Determine holding horizon: if notes contain "lt" or index is even, assume long-term (>12m)
    const isLongTerm =
      (h.notes || "").toLowerCase().includes("lt") ||
      (h.notes || "").toLowerCase().includes("long") ||
      index % 2 === 0;
    const holdingMonths = isLongTerm ? 18 : 6;

    const isEquity =
      h.assetClass === "Stocks" || h.assetClass === "Mutual Funds";
    const applicableRate = isEquity
      ? isLongTerm
        ? INDIAN_TAX_RATES.LTCG_EQUITY_PCT
        : INDIAN_TAX_RATES.STCG_EQUITY_PCT
      : INDIAN_TAX_RATES.DEBT_SLAB_PCT;

    if (gainLoss > 0) {
      if (isLongTerm) unrealizedLTGains += gainLoss;
      else unrealizedSTGains += gainLoss;
    }

    const isLoss = gainLoss < 0;
    const absLoss = Math.abs(gainLoss);

    if (isLoss) {
      totalHarvestableLoss += absLoss;
      const taxShield = (absLoss * applicableRate) / 100;
      estimatedImmediateTaxSavings += taxShield;
    }

    lots.push({
      holdingId: h.id,
      assetName: h.assetName,
      ticker: h.ticker || "UNKNOWN",
      assetClass: h.assetClass,
      investedValue: inv,
      currentValue: cur,
      unrealizedGainLoss: parseFloat(gainLoss.toFixed(2)),
      holdingPeriodMonths: holdingMonths,
      isLongTerm,
      applicableTaxRatePct: applicableRate,
      isLossHarvestCandidate: isLoss,
      suggestedAction: isLoss
        ? "HARVEST_LOSS"
        : gainLoss > 50000 && isLongTerm
        ? "BOOK_PROFIT"
        : "HOLD",
      potentialTaxShield: isLoss
        ? parseFloat(((absLoss * applicableRate) / 100).toFixed(2))
        : 0,
      washSaleWarning: isLoss,
    });
  });

  // Sort candidates so biggest tax-shield opportunities appear first
  lots.sort((a, b) => b.potentialTaxShield - a.potentialTaxShield);

  // Calculate Net Tax Liability under FY 2025-26 rules
  const effectiveRealizedST = Math.max(
    0,
    realizedGains.shortTerm - totalHarvestableLoss
  );
  const remainingLossAfterST = Math.max(
    0,
    totalHarvestableLoss - realizedGains.shortTerm
  );

  const effectiveRealizedLT = Math.max(
    0,
    realizedGains.longTerm - remainingLossAfterST
  );

  // LTCG ₹1,25,000 exemption applied to long-term gains
  const taxableLTGains = Math.max(
    0,
    effectiveRealizedLT - INDIAN_TAX_RATES.LTCG_EXEMPTION_THRESHOLD
  );
  const utilizedExemption = Math.min(
    effectiveRealizedLT,
    INDIAN_TAX_RATES.LTCG_EXEMPTION_THRESHOLD
  );

  const stcgTax =
    (effectiveRealizedST * INDIAN_TAX_RATES.STCG_EQUITY_PCT) / 100;
  const ltcgTax = (taxableLTGains * INDIAN_TAX_RATES.LTCG_EQUITY_PCT) / 100;
  const netTaxLiability = parseFloat((stcgTax + ltcgTax).toFixed(2));

  return {
    portfolioId,
    assessmentYear: "AY 2026-27",
    realizedGains,
    unrealizedGains: {
      shortTerm: parseFloat(unrealizedSTGains.toFixed(2)),
      longTerm: parseFloat(unrealizedLTGains.toFixed(2)),
    },
    ltcgExemptionAvailable: INDIAN_TAX_RATES.LTCG_EXEMPTION_THRESHOLD,
    ltcgExemptionUtilized: parseFloat(utilizedExemption.toFixed(2)),
    harvestCandidates: lots,
    totalHarvestableLoss: parseFloat(totalHarvestableLoss.toFixed(2)),
    estimatedImmediateTaxSavings: parseFloat(
      estimatedImmediateTaxSavings.toFixed(2)
    ),
    netTaxLiability,
    statutoryDisclaimer: STATUTORY_DISCLAIMER,
  };
}
