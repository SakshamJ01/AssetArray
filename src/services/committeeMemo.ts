import {
  Client,
  CommitteeMemoResult,
} from "../types/wealth";
import { calculateAttribution, STANDARD_BENCHMARKS } from "./attribution";
import { calculateHealthScore } from "./healthScore";
import { simulateScenario, PRESET_SCENARIOS } from "./scenarioEngine";
import { generateTaxHarvestReport } from "./taxIntelligence";

/**
 * DPDP Act Compliant Client Sanitizer
 * Produces an anonymized client reference to prevent transmitting personal data to third-party LLMs
 */
export function anonymizeClientForAI(client: Client): {
  anonymizedRef: string;
  category: string;
  riskProfile: string;
  totalVal: number;
} {
  // Deterministic 3-digit numeric code from client ID
  let hash = 0;
  for (let i = 0; i < (client.id || "").length; i++) {
    hash = (hash << 5) - hash + client.id.charCodeAt(i);
    hash |= 0;
  }
  const refNum = Math.abs(hash % 900) + 100;
  const anonymizedRef = `Client Ref #AA-${refNum}`;

  const holdings = client.portfolio || [];
  const totalVal = holdings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );

  return {
    anonymizedRef,
    category: client.category || "HNI",
    riskProfile: client.riskProfile || "Balanced",
    totalVal,
  };
}

/**
 * Generates a formal, structured Investment Committee Memo
 */
export function generateCommitteeMemo(client: Client): CommitteeMemoResult {
  const { anonymizedRef, category, riskProfile, totalVal } =
    anonymizeClientForAI(client);
  const holdings = client.portfolio || [];
  const dateStr = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const health = calculateHealthScore(holdings, 0, client.id);
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
  const tax = generateTaxHarvestReport(holdings, { shortTerm: 0, longTerm: 0 }, client.id);

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
          `Execute tax-loss harvesting on ${tax.harvestCandidates.filter((c) => c.isLossHarvestCandidate).length} identified positions to unlock ₹${Math.round(tax.estimatedImmediateTaxSavings).toLocaleString("en-IN")} in immediate capital gains tax shielding (Sec 111A/112A).`,
        ]
      : []),
    `Maintain scheduled rebalancing discipline within +/- 3% band of ${riskProfile} mandate.`,
  ];

  const fullMarkdown = `
# INVESTMENT COMMITTEE MEMORANDUM
**Date:** ${dateStr}  
**Mandate Reference:** ${anonymizedRef} (${category})  
**Fiduciary Standard:** SEBI RIA / DPDP Act 2023 Compliant  

---

## Executive Summary
${execSummary}

${allocationAndHealth}

${performanceAttribution}

${stressTestingSummary}

### 4. Fiduciary Recommendations & Action Plan
${fiduciaryRecommendations.map((r, i) => `${i + 1}. **Action ${i + 1}:** ${r}`).join("\n")}

---
*Generated by AssetArray Institutional Terminal v3.0. Confidential — For Investment Committee Review Only.*
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
  };
}
