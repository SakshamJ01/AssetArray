import { PortfolioHolding } from "../../../types/wealth";
import { FactorScoreResult } from "../types";

export function scoreConcentration(
  holdings: PortfolioHolding[],
  totalVal: number,
  weight = 0.20,
  maxSingleThreshold = 0.15,
  top3Threshold = 0.45
): FactorScoreResult {
  if (totalVal <= 0 || holdings.length === 0) {
    return {
      factorId: "concentration",
      name: "Single-Asset Concentration Risk",
      score: 30,
      weight,
      inputs: { largestHoldingWeight: 0, top3Weight: 0 },
      explanation: "No holdings valuation available.",
      confidence: "INSUFFICIENT_DATA",
      recommendations: ["Add holdings to assess concentration risk."],
      evidence: [{ metric: "largestHoldingWeight", value: 0 }],
    };
  }

  const sorted = [...holdings].sort(
    (a, b) => (Number(b.currentValue) || 0) - (Number(a.currentValue) || 0)
  );

  const largestVal = Number(sorted[0].currentValue) || 0;
  const largestWeight = largestVal / totalVal;
  const largestName = sorted[0].assetName || sorted[0].ticker || "Primary Asset";

  const top3Val = sorted.slice(0, 3).reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const top3Weight = top3Val / totalVal;

  // Concentration scoring logic:
  // If largest <= 15% -> 100 score.
  // Linear drop between 15% and 85% single asset weight.
  let penalty = 0;
  if (largestWeight > maxSingleThreshold) {
    penalty += (largestWeight - maxSingleThreshold) * 120;
  }
  if (top3Weight > 0.90) {
    penalty += (top3Weight - 0.90) * 40;
  }

  const score = Math.max(15, Math.min(100, Math.round(100 - penalty)));

  const recommendations: string[] = [];
  if (largestWeight > maxSingleThreshold) {
    recommendations.push(
      `Trim position in ${largestName} from ${(largestWeight * 100).toFixed(1)}% to below ${(maxSingleThreshold * 100).toFixed(0)}% to eliminate idiosyncratic tail risk.`
    );
  }
  if (top3Weight > top3Threshold) {
    recommendations.push(
      `Top 3 holdings account for ${(top3Weight * 100).toFixed(1)}% of portfolio NAV. Diversify into secondary high-conviction holdings.`
    );
  }

  return {
    factorId: "concentration",
    name: "Single-Asset Concentration Risk",
    score,
    weight,
    inputs: {
      largestHoldingWeight: parseFloat(largestWeight.toFixed(4)),
      top3Weight: parseFloat(top3Weight.toFixed(4)),
      largestHoldingName: largestName,
    },
    explanation:
      score >= 80
        ? `Well-distributed position sizing. Largest holding (${largestName}) is within prudential limits at ${(largestWeight * 100).toFixed(1)}%.`
        : `Elevated concentration: ${largestName} represents ${(largestWeight * 100).toFixed(1)}% of total portfolio capital.`,
    confidence: "HIGH",
    recommendations,
    evidence: [
      {
        metric: "largestHoldingWeight",
        value: parseFloat(largestWeight.toFixed(4)),
        target: `<= ${maxSingleThreshold}`,
        unit: "%",
      },
      {
        metric: "top3HoldingsWeight",
        value: parseFloat(top3Weight.toFixed(4)),
        target: `<= ${top3Threshold}`,
        unit: "%",
      },
    ],
  };
}
