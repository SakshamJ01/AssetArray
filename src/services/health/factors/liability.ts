import { FactorScoreResult } from "../types";

export function scoreLiability(
  totalVal: number,
  liabilitiesValue: number,
  weight = 0.10
): FactorScoreResult {
  const debt = Math.max(0, Number(liabilitiesValue) || 0);

  if (totalVal <= 0) {
    return {
      factorId: "liability",
      name: "Liability & Debt Coverage",
      score: 50,
      weight,
      inputs: { debtToAssetRatioPct: 0 },
      explanation: "No asset base available to evaluate debt coverage.",
      confidence: "INSUFFICIENT_DATA",
      recommendations: [],
      evidence: [{ metric: "debtToAssetRatio", value: "0%" }],
    };
  }

  const debtRatio = debt / totalVal;
  const debtPct = debtRatio * 100;

  let score = 100;
  const recommendations: string[] = [];

  if (debt === 0) {
    score = 100;
  } else if (debtRatio <= 0.15) {
    score = 90;
  } else if (debtRatio <= 0.30) {
    score = 75;
    recommendations.push(
      `Leverage stands at ${debtPct.toFixed(1)}% of assets. Ensure debt service obligations are fully matched by fixed-income or cash yield.`
    );
  } else if (debtRatio <= 0.50) {
    score = 55;
    recommendations.push(
      `High leverage: Debt represents ${debtPct.toFixed(1)}% of portfolio assets. Prioritize principal debt amortization.`
    );
  } else {
    score = 30;
    recommendations.push(
      `Critical solvency risk: Liabilities exceed 50% of liquid assets (${debtPct.toFixed(1)}%). Immediate debt restructuring required.`
    );
  }

  return {
    factorId: "liability",
    name: "Liability & Debt Coverage",
    score,
    weight,
    inputs: { debtToAssetRatioPct: parseFloat(debtPct.toFixed(2)), totalLiabilities: debt },
    explanation:
      debt === 0
        ? "Unencumbered portfolio balance sheet with zero external leverage."
        : score >= 75
        ? `Manageable debt coverage: liabilities equal ${debtPct.toFixed(1)}% of liquid portfolio net worth.`
        : `Elevated debt load: liabilities consume ${debtPct.toFixed(1)}% of portfolio assets.`,
    confidence: "HIGH",
    recommendations,
    evidence: [
      {
        metric: "debtToAssetRatio",
        value: `${debtPct.toFixed(1)}%`,
        target: "< 25.0%",
        unit: "%",
      },
    ],
  };
}
