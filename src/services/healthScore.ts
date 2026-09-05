import {
  HealthScoreFactors,
  HealthScoreResult,
  PortfolioHolding,
} from "../types/wealth";
import { normalizeCategory } from "./attribution";

/**
 * Calculates a multi-pillar 0-100 Portfolio Health Diagnostic Score
 */
export function calculateHealthScore(
  holdings: PortfolioHolding[],
  liabilitiesValue: number = 0,
  portfolioId: string = "default-portfolio"
): HealthScoreResult {
  const totalVal = holdings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );

  if (holdings.length === 0 || totalVal <= 0) {
    return {
      portfolioId,
      healthScore: 30,
      grade: "High Fragility",
      factors: {
        dataCompleteness: 10,
        assetDiversification: 20,
        concentrationRisk: 30,
        geographicAndCurrency: 20,
        liabilityManagement: 50,
      },
      categoryDistribution: {},
      recommendations: [
        "Portfolio has no active holdings recorded. Add positions to generate health diagnostics.",
        "Establish baseline asset allocation across core equity and fixed income.",
      ],
    };
  }

  // 1. Data Completeness (0 - 100)
  let completePoints = 0;
  holdings.forEach((h) => {
    let itemScore = 0;
    if (h.assetName?.trim()) itemScore += 20;
    if (h.ticker?.trim()) itemScore += 20;
    if (Number(h.currentValue) > 0) itemScore += 25;
    if (Number(h.investedValue) > 0) itemScore += 20;
    if (Number(h.quantity) > 0 || h.assetClass) itemScore += 15;
    completePoints += itemScore;
  });
  const dataCompleteness = Math.min(
    100,
    Math.round(completePoints / holdings.length)
  );

  // Category aggregations
  const categoryVals: Record<string, number> = {};
  let maxSingleHoldingVal = 0;
  let maxSingleHoldingName = "";

  holdings.forEach((h) => {
    const cat = normalizeCategory(h.assetClass);
    const val = Number(h.currentValue) || 0;
    categoryVals[cat] = (categoryVals[cat] || 0) + val;
    if (val > maxSingleHoldingVal) {
      maxSingleHoldingVal = val;
      maxSingleHoldingName = h.assetName || h.ticker || "Asset";
    }
  });

  const categoryDistribution: Record<string, number> = {};
  Object.keys(categoryVals).forEach((cat) => {
    categoryDistribution[cat] = parseFloat(
      ((categoryVals[cat] / totalVal) * 100).toFixed(1)
    );
  });

  // 2. Asset Diversification (0 - 100) using normalized HHI
  // HHI = sum(w_i^2). If 1 asset class, HHI = 1.0 (min score).
  const weights = Object.values(categoryVals).map((v) => v / totalVal);
  const hhi = weights.reduce((sum, w) => sum + w * w, 0); // between 0.2 and 1.0
  // Scale: HHI of 0.25 (perfect 4-way balance) -> ~95, HHI of 1.0 -> ~30
  const assetDiversification = Math.min(
    100,
    Math.max(25, Math.round(115 - hhi * 85))
  );

  // 3. Concentration Risk (0 - 100)
  // Max single holding weight penalty
  const maxWeight = totalVal > 0 ? maxSingleHoldingVal / totalVal : 1.0;
  let concentrationRisk = 100;
  if (maxWeight > 0.15) {
    // Drops from 100 down to 25 if single asset is 75%+
    concentrationRisk = Math.max(20, Math.round(100 - (maxWeight - 0.15) * 130));
  }

  // 4. Geographic & Currency Spread (0 - 100)
  // Evaluates exposure to multi-asset hedges (Alternatives, Gold, Global)
  let geoCurScore = 50;
  if (categoryVals["Alternatives"] && categoryVals["Alternatives"] > 0) geoCurScore += 20;
  if (categoryVals["Stocks"] && categoryVals["Bonds"]) geoCurScore += 20;
  if (holdings.some((h) => (h.ticker || "").includes("US") || (h.notes || "").toLowerCase().includes("global"))) {
    geoCurScore += 10;
  }
  const geographicAndCurrency = Math.min(100, geoCurScore);

  // 5. Liability & Cash Management (0 - 100)
  const cashVal = categoryVals["Cash"] || 0;
  const cashRatio = cashVal / totalVal;
  let liabilityScore = 80;
  if (cashRatio >= 0.05 && cashRatio <= 0.20) {
    liabilityScore = 95; // Ideal liquidity buffer
  } else if (cashRatio < 0.02) {
    liabilityScore = 60; // Cash dry
  }

  if (liabilitiesValue > 0) {
    const debtRatio = liabilitiesValue / (totalVal + liabilitiesValue);
    if (debtRatio > 0.4) liabilityScore = Math.max(25, liabilityScore - 35);
    else if (debtRatio > 0.2) liabilityScore = Math.max(40, liabilityScore - 15);
  }
  const liabilityManagement = Math.min(100, liabilityScore);

  // Total weighted score
  const overallHealth = Math.round(
    0.20 * dataCompleteness +
      0.25 * assetDiversification +
      0.25 * concentrationRisk +
      0.15 * geographicAndCurrency +
      0.15 * liabilityManagement
  );

  let grade: HealthScoreResult["grade"] = "Balanced";
  if (overallHealth >= 85) grade = "Institutional";
  else if (overallHealth >= 70) grade = "Balanced";
  else if (overallHealth >= 50) grade = "Moderate Risk";
  else grade = "High Fragility";

  // Prioritized Recommendations
  const recommendations: string[] = [];
  if (maxWeight > 0.20) {
    recommendations.push(
      `High concentration alert: ${maxSingleHoldingName} represents ${(maxWeight * 100).toFixed(1)}% of total portfolio. Trim to below 15% to mitigate single-issuer risk.`
    );
  }
  if (assetDiversification < 65) {
    recommendations.push(
      "Asset diversification is constrained. Allocate to non-correlated asset classes (Fixed Income, Sovereign Gold Bonds, Liquid Cash) to improve Sharpe ratio."
    );
  }
  if (cashRatio < 0.03) {
    recommendations.push(
      "Cash buffer is below 3%. Build a 5% to 10% emergency/opportunistic cash reserve for volatility rebalancing."
    );
  }
  if (dataCompleteness < 80) {
    recommendations.push(
      "Update missing purchase prices and tickers on older positions to ensure accurate tax lot tracking."
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Portfolio exhibits institutional-grade balance across diversification, liquidity reserves, and risk exposure."
    );
  }

  return {
    portfolioId,
    healthScore: overallHealth,
    grade,
    factors: {
      dataCompleteness,
      assetDiversification,
      concentrationRisk,
      geographicAndCurrency,
      liabilityManagement,
    },
    categoryDistribution,
    recommendations,
  };
}
