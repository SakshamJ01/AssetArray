import { PortfolioHolding } from "../../../types/wealth";
import { FactorScoreResult } from "../types";

export function scoreDataQuality(
  holdings: PortfolioHolding[],
  weight = 0.10
): FactorScoreResult {
  if (holdings.length === 0) {
    return {
      factorId: "dataQuality",
      name: "Data Quality & Provenance",
      score: 20,
      weight,
      inputs: { totalHoldings: 0, missingFields: 0 },
      explanation: "No holdings data provided. Portfolio records are empty.",
      confidence: "INSUFFICIENT_DATA",
      recommendations: ["Import or enter initial portfolio holdings and transaction lots."],
      evidence: [{ metric: "totalPositions", value: 0 }],
    };
  }

  let totalChecks = 0;
  let passedChecks = 0;

  holdings.forEach((h) => {
    // Check 1: Valid current value > 0
    totalChecks++;
    if (Number(h.currentValue) > 0) passedChecks++;

    // Check 2: Valid invested value >= 0
    totalChecks++;
    if (Number(h.investedValue) >= 0) passedChecks++;

    // Check 3: Valid ticker or identifier
    totalChecks++;
    if (h.ticker && h.ticker.trim() !== "" && h.ticker !== "UNKNOWN") passedChecks++;

    // Check 4: Valid asset class
    totalChecks++;
    if (h.assetClass && ["Stocks", "Bonds", "Mutual Funds", "Cash", "Alternatives"].includes(h.assetClass)) {
      passedChecks++;
    }
  });

  const completeness = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
  const score = Math.round(completeness);

  const recommendations: string[] = [];
  if (score < 80) {
    recommendations.push("Update missing ticker symbols, purchase cost basis, or asset classes.");
  }

  return {
    factorId: "dataQuality",
    name: "Data Quality & Completeness",
    score,
    weight,
    inputs: { totalChecks, passedChecks, completenessPct: Math.round(completeness) },
    explanation:
      score >= 90
        ? "Holding records, valuation metrics, and asset taxonomy are complete."
        : `Identified ${totalChecks - passedChecks} missing or incomplete holding data points.`,
    confidence: score >= 85 ? "HIGH" : score >= 60 ? "MEDIUM" : "LOW",
    recommendations,
    evidence: [
      { metric: "dataCompleteness", value: `${Math.round(completeness)}%`, target: "100%" },
      { metric: "validHoldingsRatio", value: `${passedChecks}/${totalChecks}` },
    ],
  };
}
