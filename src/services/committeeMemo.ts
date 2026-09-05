import { Client, CommitteeMemoResult } from "../types/wealth";
import { calculateAttribution, STANDARD_BENCHMARKS } from "./attribution";
import { calculateInstitutionalHealthScore } from "./health";
import { simulateScenario, PRESET_SCENARIOS } from "./scenarioEngine";
import { generateInstitutionalTaxReport } from "./tax";
import { sanitizeForAI } from "./ai/aiSanitizer";

export const COMMITTEE_MEMO_METHODOLOGY_VERSION = "ic-memo-grounded-v1.1";

export interface SourceMetricCitation {
  statement: string;
  sourceMetric: string;
  value: number | string;
}

export interface GroundedCommitteeMemoResult extends CommitteeMemoResult {
  sourceCitations: SourceMetricCitation[];
  dataQualityConfidence: string;
  methodologyVersion: string;
}

/**
 * DPDP-Aligned Privacy Client Sanitizer
 * Produces an anonymized client reference to prevent transmitting personal data to third-party LLMs
 */
export function anonymizeClientForAI(client: Client): {
  anonymizedRef: string;
  category: string;
  riskProfile: string;
  totalVal: number;
} {
  const sanitized = sanitizeForAI(client);
  return {
    anonymizedRef: sanitized.anonymizedRef,
    category: sanitized.category,
    riskProfile: sanitized.riskProfile,
    totalVal: sanitized.totalPortfolioValue,
  };
}

/**
 * Generates a formal, structured Investment Committee Memo
 * with every numerical assertion strictly grounded in deterministic source metrics.
 */
export function generateCommitteeMemo(client: Client): GroundedCommitteeMemoResult {
  const sanitized = sanitizeForAI(client);
  const anonymizedRef = sanitized.anonymizedRef;
  const category = sanitized.category;
  const riskProfile = sanitized.riskProfile;
  const totalVal = sanitized.totalPortfolioValue;

  const holdings = client.portfolio || [];
  const dateStr = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Execute deterministic analytical engines
  const health = calculateInstitutionalHealthScore(holdings, 0, client.id);
  const attribution = calculateAttribution(
    holdings,
    STANDARD_BENCHMARKS.BALANCED_HYBRID,
    client.id
  );
  const stress = simulateScenario(
    holdings,
    PRESET_SCENARIOS.TECH_CORRECTION,
    client.id
  );
  const tax = generateInstitutionalTaxReport(
    holdings,
    { shortTerm: 0, longTerm: 0 },
    client.id
  );

  // Build rigorous source citations
  const sourceCitations: SourceMetricCitation[] = [
    {
      statement: `Portfolio AUM stands at ₹${totalVal.toLocaleString("en-IN")}`,
      sourceMetric: "portfolio.totalAUM",
      value: totalVal,
    },
    {
      statement: `Diagnostic rating of "${health.grade}" with Health Index of ${health.healthScore}/100`,
      sourceMetric: "healthScore.overall",
      value: health.healthScore,
    },
    {
      statement: `Active alpha against benchmark of ${(attribution.totalActiveReturn * 100).toFixed(2)}%`,
      sourceMetric: "attribution.totalActiveReturn",
      value: attribution.totalActiveReturn,
    },
    {
      statement: `Brinson-Fachler allocation effect of ${(attribution.summary.allocationEffect * 10000).toFixed(0)} bps`,
      sourceMetric: "attribution.allocationEffectBps",
      value: Math.round(attribution.summary.allocationEffect * 10000),
    },
    {
      statement: `Brinson-Fachler selection effect of ${(attribution.summary.selectionEffect * 10000).toFixed(0)} bps`,
      sourceMetric: "attribution.selectionEffectBps",
      value: Math.round(attribution.summary.selectionEffect * 10000),
    },
    {
      statement: `Macro scenario projected impact of ${stress.percentChange >= 0 ? "+" : ""}${stress.percentChange}%`,
      sourceMetric: "stressTest.percentChange",
      value: stress.percentChange,
    },
    {
      statement: `Identified harvestable loss of ₹${Math.round(tax.totalHarvestableLoss).toLocaleString("en-IN")}`,
      sourceMetric: "taxHarvesting.totalHarvestableLoss",
      value: tax.totalHarvestableLoss,
    },
  ];

  const execSummary = `Investment Committee Review for ${anonymizedRef} (${category}, ${riskProfile} mandate). Portfolio AUM stands at ₹${Math.round(totalVal).toLocaleString("en-IN")}. Overall diagnostic rating is "${health.grade}" with an AI Health Index of ${health.healthScore}/100. Portfolio generated ${attribution.totalActiveReturn >= 0 ? "+" : ""}${(attribution.totalActiveReturn * 100).toFixed(2)}% active return against ${attribution.benchmarkName}.`;

  const allocationAndHealth = `### 1. Portfolio Composition & Diagnostic Health
- **Total AUM:** ₹${Math.round(totalVal).toLocaleString("en-IN")}
- **Health Score:** ${health.healthScore} / 100 (${health.grade})
- **Factor Diagnostic Scores:**
  - Data Completeness: ${health.factors.dataCompleteness}%
  - Diversification (HHI): ${health.factors.assetDiversification}%
  - Single-Asset Concentration: ${health.factors.concentrationRisk}%
  - Geographic/Currency Spread: ${health.factors.geographicAndCurrency}%
  - Cash Buffer & Liabilities: ${health.factors.liabilityManagement}%
- **Asset Allocation:** ${Object.entries(health.categoryDistribution).map(([k, v]) => `${k} (${v}%)`).join(", ") || "Unassigned"}`;

  const performanceAttribution = `### 2. Performance Attribution (Brinson-Fachler Model)
- **Benchmark:** ${attribution.benchmarkName} (${attribution.benchmarkSymbol})
- **Portfolio Return:** ${(attribution.portfolioReturn * 100).toFixed(2)}%
- **Benchmark Return:** ${(attribution.benchmarkReturn * 100).toFixed(2)}%
- **Net Active Alpha:** ${(attribution.totalActiveReturn * 100).toFixed(2)}%
- **Attribution Breakdown:**
  - Allocation Effect: ${(attribution.summary.allocationEffect * 10000).toFixed(0)} bps
  - Selection Effect: ${(attribution.summary.selectionEffect * 10000).toFixed(0)} bps
  - Interaction Effect: ${(attribution.summary.interactionEffect * 10000).toFixed(0)} bps
- **Key Observation:** ${attribution.narrativeExplanation}`;

  const stressTestingSummary = `### 3. Macro Stress Test & Downside Resilience
- **Scenario Simulated:** ${stress.scenarioName}
- **Projected Value:** ₹${stress.projectedValue.toLocaleString("en-IN")} (${stress.percentChange >= 0 ? "+" : ""}${stress.percentChange}%)
- **Downside Tail Risk (P5):** ₹${stress.valueDistribution[0]?.value.toLocaleString("en-IN") || "N/A"}
- **Post-Shock Sharpe Ratio:** ${stress.postShockSharpe}
- **Stress Commentary:** ${stress.advisoryCommentary}`;

  const fiduciaryRecommendations: string[] = [
    ...health.recommendations,
    ...(tax.totalHarvestableLoss > 0
      ? [
          `Execute tax-loss harvesting on ${tax.harvestCandidates.filter((c) => c.isLossHarvestCandidate).length} identified positions to unlock ₹${Math.round(tax.estimatedImmediateTaxSavings).toLocaleString("en-IN")} in estimated capital gains tax impact (Sec 111A/112A).`,
        ]
      : []),
    `Maintain scheduled rebalancing discipline within +/- 3% band of ${riskProfile} mandate.`,
  ];

  const fullMarkdown = `
# INVESTMENT COMMITTEE MEMORANDUM
**Date:** ${dateStr}  
**Mandate Reference:** ${anonymizedRef} (${category})  
**Advisor Governance:** SEBI-Aware Workflow / DPDP-Aligned Privacy Controls  

---

## Executive Summary
${execSummary}

${allocationAndHealth}

${performanceAttribution}

${stressTestingSummary}

### 4. Fiduciary Recommendations & Action Plan
${fiduciaryRecommendations.map((r, i) => `${i + 1}. **Action ${i + 1}:** ${r}`).join("\n")}

### 5. Grounded Analytical Citations & Methodology
${sourceCitations.map((c) => `- **${c.statement}** (Verified: \`${c.sourceMetric}\` = ${c.value})`).join("\n")}

---
*Generated by AssetArray Institutional Terminal v3.1. Confidential — For Investment Committee Review Only.*
  `.trim();

  return {
    memoId: `memo_${client.id}_${Date.now()}`,
    clientId: client.id,
    anonymizedClientRef: anonymizedRef,
    date: dateStr,
    executiveSummary: execSummary,
    allocationAndHealth,
    performanceAttribution,
    stressTestingSummary,
    fiduciaryRecommendations,
    fullMarkdownReport: fullMarkdown,
    sourceCitations,
    dataQualityConfidence: health.confidence,
    methodologyVersion: COMMITTEE_MEMO_METHODOLOGY_VERSION,
  };
}
