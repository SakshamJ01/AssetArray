import { AssetClass, PortfolioHolding, TaxLot } from "../../types/wealth";
import { TaxLotCalculationResult, TaxRuleSet } from "./types";
import { DEFAULT_INDIAN_TAX_RULESET } from "./taxRules";

/**
 * Computes holding duration in months strictly from acquisition date to as-of date.
 */
export function calculateLotHoldingMonths(
  acquiredAt: string,
  asOfDate: string = new Date().toISOString()
): number | null {
  if (!acquiredAt) return null;

  const acq = new Date(acquiredAt);
  const asOf = new Date(asOfDate);

  if (isNaN(acq.getTime()) || isNaN(asOf.getTime())) {
    return null;
  }

  const diffMs = asOf.getTime() - acq.getTime();
  if (diffMs < 0) return 0;

  // Average days per month = 365.25 / 12 = 30.4375
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return parseFloat((diffDays / 30.4375).toFixed(1));
}

/**
 * Resolves whether a lot is Long-Term based on statutory asset-class holding rules.
 */
export function classifyLotTerm(
  assetClass: AssetClass,
  holdingPeriodMonths: number | null,
  ruleSet: TaxRuleSet = DEFAULT_INDIAN_TAX_RULESET
): { isLongTerm: boolean | null; thresholdMonths: number } {
  const rule = ruleSet.holdingPeriodRules.find((r) => r.assetClass === assetClass) || {
    assetClass,
    isListed: true,
    thresholdMonths: 12,
  };

  if (holdingPeriodMonths === null) {
    return { isLongTerm: null, thresholdMonths: rule.thresholdMonths };
  }

  return {
    isLongTerm: holdingPeriodMonths >= rule.thresholdMonths,
    thresholdMonths: rule.thresholdMonths,
  };
}

/**
 * Evaluates individual tax lots for a holding.
 */
export function evaluateTaxLots(
  holding: PortfolioHolding,
  ruleSet: TaxRuleSet = DEFAULT_INDIAN_TAX_RULESET,
  asOfDate: string = new Date().toISOString()
): TaxLotCalculationResult[] {
  const results: TaxLotCalculationResult[] = [];

  // If explicit tax lots exist on the holding, evaluate each lot
  if (holding.taxLots && holding.taxLots.length > 0) {
    holding.taxLots.forEach((lot) => {
      const months = calculateLotHoldingMonths(lot.acquiredAt, asOfDate);
      const { isLongTerm } = classifyLotTerm(lot.assetClass, months, ruleSet);

      const qty = lot.remainingQuantity > 0 ? lot.remainingQuantity : lot.quantity;
      const curPrice =
        Number(holding.quantity) > 0
          ? (Number(holding.currentValue) || 0) / Number(holding.quantity)
          : 0;
      const lotCurVal = curPrice > 0 ? curPrice * qty : lot.costBasis;
      const gainLoss = lotCurVal - lot.costBasis;

      const warnings: string[] = [];
      if (months === null) {
        warnings.push(`Lot ${lot.id} lacks a valid acquisition date.`);
      }

      results.push({
        lotId: lot.id,
        securityId: lot.securityId,
        ticker: lot.ticker || holding.ticker || "UNKNOWN",
        assetClass: lot.assetClass,
        quantity: qty,
        acquiredAt: lot.acquiredAt,
        costBasis: lot.costBasis,
        currentValue: parseFloat(lotCurVal.toFixed(2)),
        unrealizedGainLoss: parseFloat(gainLoss.toFixed(2)),
        holdingPeriodMonths: months,
        isLongTerm,
        quality: months !== null ? "HIGH" : "INSUFFICIENT_DATA",
        warnings,
      });
    });
    return results;
  }

  // If holding does not have segmented lots, evaluate holding as a single aggregated lot
  const curVal = Number(holding.currentValue) || 0;
  const invVal = Number(holding.investedValue) || 0;
  const gainLoss = curVal - invVal;

  let acquiredAt = holding.acquiredAt || "";
  const warnings: string[] = [];

  let months = calculateLotHoldingMonths(acquiredAt, asOfDate);

  // Check if notes contain an explicit date or legacy note description
  if (months === null && holding.notes) {
    const match = holding.notes.match(/\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2})\b/);
    if (match) {
      acquiredAt = match[1].replace(/\//g, "-");
      months = calculateLotHoldingMonths(acquiredAt, asOfDate);
    } else if (holding.notes.toLowerCase().includes("short")) {
      months = 6;
      warnings.push(
        `Holding '${holding.assetName}' classified as short-term based on notes ('short'). Formal transaction date required for institutional audit.`
      );
    } else if (
      holding.notes.toLowerCase().includes("lt") ||
      holding.notes.toLowerCase().includes("long")
    ) {
      months = 18;
      warnings.push(
        `Holding '${holding.assetName}' classified as long-term based on notes ('long'). Formal transaction date required for institutional audit.`
      );
    }
  }

  const { isLongTerm, thresholdMonths } = classifyLotTerm(holding.assetClass, months, ruleSet);

  if (months === null) {
    warnings.push(
      `Holding '${holding.assetName}' lacks an acquisition date. Statutory holding period cannot be determined from dates.`
    );
  }

  results.push({
    lotId: `lot_${holding.id}`,
    securityId: holding.id,
    ticker: holding.ticker || "UNKNOWN",
    assetClass: holding.assetClass,
    quantity: Number(holding.quantity) || 1,
    acquiredAt,
    costBasis: invVal,
    currentValue: curVal,
    unrealizedGainLoss: parseFloat(gainLoss.toFixed(2)),
    holdingPeriodMonths: months,
    isLongTerm,
    quality: months !== null ? "HIGH" : "LOW",
    warnings,
  });

  return results;
}
