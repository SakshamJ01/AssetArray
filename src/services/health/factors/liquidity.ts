import { PortfolioHolding } from "../../../types/wealth";
import { normalizeCategory } from "../../attribution";
import { FactorScoreResult } from "../types";

export function scoreLiquidity(
  holdings: PortfolioHolding[],
  totalVal: number,
  weight = 0.15
): FactorScoreResult {
  if (totalVal <= 0 || holdings.length === 0) {
    return {
      factorId: "liquidity",
      name: "Liquidity & Cash Runway",
      score: 30,
      weight,
      inputs: { cashWeightPct: 0 },
      explanation: "No liquidity data available.",
      confidence: "INSUFFICIENT_DATA",
      recommendations: ["Maintain a liquid cash buffer."],
      evidence: [{ metric: "cashBufferRatio", value: "0%" }],
    };
  }

  let liquidVal = 0;
  holdings.forEach((h) => {
    const cat = normalizeCategory(h.assetClass);
    const name = (h.assetName || "").toLowerCase();
    const isLiquidFund =
      name.includes("liquid") ||
      name.includes("overnight") ||
      name.includes("money market") ||
      name.includes("treasury");

    if (cat === "Cash" || isLiquidFund) {
      liquidVal += Number(h.currentValue) || 0;
    }
  });

  const cashRatio = liquidVal / totalVal;
  const cashPct = cashRatio * 100;

  let score = 90;
  const recommendations: string[] = [];

  if (cashRatio < 0.03) {
    // Dangerously low liquidity
    score = 45;
    recommendations.push(
      "Liquid cash reserves are under 3% of portfolio NAV. Increase allocation to overnight or liquid funds to cover contingency cash calls."
    );
  } else if (cashRatio < 0.05) {
    score = 70;
    recommendations.push("Cash buffer is slightly below the recommended 5% fiduciary threshold.");
  } else if (cashRatio >= 0.05 && cashRatio <= 0.18) {
    // Optimal 5% - 18% liquidity runway
    score = 95;
  } else if (cashRatio > 0.18 && cashRatio <= 0.35) {
    score = 75;
    recommendations.push(
      "Cash allocation is elevated (>18%), causing cash drag on portfolio real returns. Deploy excess cash into systematic investment plans."
    );
  } else {
    // Extreme cash drag
    score = 50;
    recommendations.push(
      `Extreme cash drag: ${(cashPct).toFixed(1)}% of capital remains uninvested. Redeploy into core productive asset classes.`
    );
  }

  return {
    factorId: "liquidity",
    name: "Liquidity & Cash Runway",
    score,
    weight,
    inputs: { cashWeightPct: parseFloat(cashPct.toFixed(2)), liquidValue: liquidVal },
    explanation:
      score >= 85
        ? `Comfortable liquidity runway (${cashPct.toFixed(1)}% in liquid reserves) protecting against forced liquidation.`
        : cashRatio < 0.05
        ? `Inadequate cash buffer (${cashPct.toFixed(1)}%), exposing portfolio to liquidity stress.`
        : `Cash drag: ${(cashPct).toFixed(1)}% is parked in sub-inflationary cash equivalents.`,
    confidence: "HIGH",
    recommendations,
    evidence: [
      {
        metric: "cashBufferRatio",
        value: `${cashPct.toFixed(1)}%`,
        target: "5.0% - 15.0%",
        unit: "%",
      },
    ],
  };
}
