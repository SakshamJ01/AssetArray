import {
  PortfolioHolding,
  Goal,
  HealthScoreResult,
  HealthScoreFactors,
  DataQualityState,
} from "../../types/wealth";
import { normalizeCategory } from "../attribution";
import {
  FactorScoreResult,
  HealthEvidencePoint,
  HealthScoreConfig,
  InstitutionalHealthScoreResult,
} from "./types";
import { scoreDataQuality } from "./factors/dataQuality";
import { scoreAssetDiversification } from "./factors/assetDiversification";
import { scoreConcentration } from "./factors/concentration";
import { scoreGeographicAndCurrency } from "./factors/geographicAndCurrency";
import { scoreLiquidity } from "./factors/liquidity";
import { scoreLiability } from "./factors/liability";
import { scoreGoalAlignment } from "./factors/goalAlignment";

export * from "./types";
export const HEALTH_SCORE_METHODOLOGY_VERSION = "health-score-v1.2";

/**
 * Calculates deterministic, explainable, and factor-driven 0-100 Portfolio Health Score.
 */
export function calculateInstitutionalHealthScore(
  holdings: PortfolioHolding[],
  liabilitiesValue: number = 0,
  portfolioId: string = "default-portfolio",
  goals?: Goal[],
  config?: HealthScoreConfig
): InstitutionalHealthScoreResult {
  const totalVal = holdings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );

  // Category distribution for asset allocation breakdown
  const categoryDistribution: Record<string, number> = {};
  if (totalVal > 0) {
    holdings.forEach((h) => {
      const cat = normalizeCategory(h.assetClass);
      const val = Number(h.currentValue) || 0;
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + val;
    });
    Object.keys(categoryDistribution).forEach((k) => {
      categoryDistribution[k] = parseFloat(
        ((categoryDistribution[k] / totalVal) * 100).toFixed(1)
      );
    });
  }

  if (totalVal <= 0 || holdings.length === 0) {
    const emptyFactors: HealthScoreFactors = {
      dataCompleteness: 10,
      assetDiversification: 20,
      concentrationRisk: 30,
      geographicAndCurrency: 20,
      liabilityManagement: 50,
    };
    return {
      portfolioId,
      healthScore: 30,
      grade: "High Fragility",
      factors: emptyFactors,
      categoryDistribution: {},
      recommendations: [
        "Portfolio has no active holdings recorded. Add positions to generate health diagnostics.",
        "Establish baseline asset allocation across core equity and fixed income.",
      ],
      confidence: "INSUFFICIENT_DATA",
      explanation: "No assets found in portfolio.",
      evidence: [{ metric: "totalValuation", value: 0 }],
      detailedFactors: [],
      methodologyVersion: HEALTH_SCORE_METHODOLOGY_VERSION,
    };
  }

  // Evaluate each modular factor
  const fDataQuality = scoreDataQuality(holdings, config?.weights?.dataQuality ?? 0.10);
  const fDiversification = scoreAssetDiversification(
    holdings,
    totalVal,
    config?.weights?.assetDiversification ?? 0.20
  );
  const fConcentration = scoreConcentration(
    holdings,
    totalVal,
    config?.weights?.concentration ?? 0.20,
    config?.concentrationThreshold ?? 0.15,
    config?.top3Threshold ?? 0.45
  );
  const fGeographic = scoreGeographicAndCurrency(
    holdings,
    totalVal,
    config?.weights?.geographicExposure ?? 0.15
  );
  const fLiquidity = scoreLiquidity(
    holdings,
    totalVal,
    config?.weights?.liquidity ?? 0.15
  );
  const fLiability = scoreLiability(
    totalVal,
    liabilitiesValue,
    config?.weights?.liability ?? 0.10
  );
  const fGoals = scoreGoalAlignment(
    goals,
    config?.weights?.goalAlignment ?? 0.10
  );

  const detailedFactors: FactorScoreResult[] = [
    fDataQuality,
    fDiversification,
    fConcentration,
    fGeographic,
    fLiquidity,
    fLiability,
    fGoals,
  ];

  // Aggregate weighted score
  const totalWeight = detailedFactors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = detailedFactors.reduce(
    (sum, f) => sum + f.score * f.weight,
    0
  );
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 50;
  const healthScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Assign institutional grade
  let grade: HealthScoreResult["grade"] = "Balanced";
  if (healthScore >= 85) grade = "Institutional";
  else if (healthScore >= 70) grade = "Balanced";
  else if (healthScore >= 50) grade = "Moderate Risk";
  else grade = "High Fragility";

  // Consolidate prioritized fiduciary recommendations
  const allRecommendations: string[] = [];
  detailedFactors.forEach((f) => {
    allRecommendations.push(...f.recommendations);
  });
  const recommendations = Array.from(new Set(allRecommendations)).slice(0, 4);
  if (recommendations.length === 0) {
    recommendations.push("Portfolio parameters are well balanced across all diagnostic factors.");
  }

  // Collect consolidated evidence items
  const evidence: HealthEvidencePoint[] = [];
  detailedFactors.forEach((f) => {
    evidence.push(...f.evidence);
  });

  // Overall confidence
  const lowCount = detailedFactors.filter((f) => f.confidence === "LOW" || f.confidence === "INSUFFICIENT_DATA").length;
  const confidence: DataQualityState =
    lowCount >= 2 ? "LOW" : lowCount === 1 ? "MEDIUM" : "HIGH";

  // Synthesize executive explanation
  const lowestFactor = [...detailedFactors].sort((a, b) => a.score - b.score)[0];
  const explanation =
    healthScore >= 80
      ? `Robust portfolio health score of ${healthScore}/100. Core resilience driven by sound diversification and prudent position sizing.`
      : `Portfolio health score is ${healthScore}/100. Chief area of vulnerability is ${lowestFactor.name.toLowerCase()} (rated ${lowestFactor.score}/100).`;

  // Legacy factor compatibility mapping
  const factors: HealthScoreFactors = {
    dataCompleteness: fDataQuality.score,
    assetDiversification: fDiversification.score,
    concentrationRisk: fConcentration.score,
    geographicAndCurrency: fGeographic.score,
    liabilityManagement: Math.round((fLiquidity.score + fLiability.score) / 2),
  };

  return {
    portfolioId,
    healthScore,
    grade,
    factors,
    categoryDistribution,
    recommendations,
    confidence,
    explanation,
    evidence,
    detailedFactors,
    methodologyVersion: HEALTH_SCORE_METHODOLOGY_VERSION,
  };
}
