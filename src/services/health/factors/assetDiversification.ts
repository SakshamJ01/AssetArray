import { PortfolioHolding } from "../../../types/wealth";
import { normalizeCategory } from "../../attribution";
import { FactorScoreResult } from "../types";

export function scoreAssetDiversification(
  holdings: PortfolioHolding[],
  totalVal: number,
  weight = 0.20
): FactorScoreResult {
  if (totalVal <= 0 || holdings.length === 0) {
    return {
      factorId: "assetDiversification",
      name: "Asset Class Diversification",
      score: 20,
      weight,
      inputs: { totalCategories: 0, hhi: 1.0 },
      explanation: "No capital allocated across asset classes.",
      confidence: "INSUFFICIENT_DATA",
      recommendations: ["Allocate capital across equities, fixed income, cash, and alternatives."],
      evidence: [{ metric: "activeAssetClasses", value: 0, target: 4 }],
    };
  }

  const categoryVals: Record<string, number> = {};
  holdings.forEach((h) => {
    const cat = normalizeCategory(h.assetClass);
    categoryVals[cat] = (categoryVals[cat] || 0) + (Number(h.currentValue) || 0);
  });

  const categories = Object.keys(categoryVals);
  const weights = categories.map((c) => categoryVals[c] / totalVal);

  // Compute HHI (Herfindahl-Hirschman Index)
  // Ranges from 0.2 (perfect 5-bucket spread) to 1.0 (100% in single asset class)
  const hhi = weights.reduce((sum, w) => sum + w * w, 0);

  // Normalized score: 1.0 HHI -> 30 score, 0.25 HHI -> 100 score
  const rawScore = 100 - ((hhi - 0.25) / 0.75) * 70;
  const score = Math.max(20, Math.min(100, Math.round(rawScore)));

  const recommendations: string[] = [];
  if (categories.length < 3) {
    recommendations.push("Portfolio is concentrated in fewer than 3 asset classes. Consider broadening multi-asset allocation.");
  }
  if (hhi > 0.60) {
    recommendations.push("High asset-class concentration increases systemic vulnerability. Rebalance toward defensive uncorrelated assets.");
  }

  return {
    factorId: "assetDiversification",
    name: "Asset Class Diversification",
    score,
    weight,
    inputs: { activeCategories: categories.length, hhi: parseFloat(hhi.toFixed(3)) },
    explanation:
      score >= 80
        ? `Healthy multi-asset allocation spanning ${categories.length} distinct asset classes (HHI: ${hhi.toFixed(2)}).`
        : `Elevated asset-class concentration (HHI: ${hhi.toFixed(2)}) across only ${categories.length} asset classes.`,
    confidence: "HIGH",
    recommendations,
    evidence: [
      { metric: "herfindahlIndex", value: parseFloat(hhi.toFixed(3)), target: "< 0.40" },
      { metric: "activeAssetClasses", value: categories.length, target: ">= 3" },
    ],
  };
}
