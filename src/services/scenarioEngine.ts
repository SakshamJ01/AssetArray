import {
  ScenarioShockParams,
  ScenarioResult,
  ScenarioDistributionPoint,
  PortfolioHolding,
  WhatIfScenario,
  WhatIfScenarioChange,
} from "../types/wealth";
import { normalizeCategory } from "./attribution";
import { calculateHealthScore } from "./healthScore";
import { calculateStatutoryCapitalGainsTax } from "./tax/taxCalculator";

export const SCENARIO_ENGINE_METHODOLOGY_VERSION = "whatif-sandbox-v2.0";

export const PRESET_SCENARIOS: Record<string, ScenarioShockParams> = {
  GLOBAL_FINANCIAL_CRISIS: {
    name: "2008 GFC Liquidity Crunch",
    equityShockPct: -35.0,
    debtYieldBps: -150, // Bonds rally +5%
    commodityShockPct: -30.0,
    currencyDevaluationPct: -10.0,
    inflationShockPct: -2.0,
  },
  TECH_CORRECTION: {
    name: "Tech Valuation & Rate Shock",
    equityShockPct: -22.0,
    debtYieldBps: 150, // Higher yields hurt bond prices
    commodityShockPct: -5.0,
    currencyDevaluationPct: -4.0,
    inflationShockPct: 1.5,
  },
  STAGFLATION_SHOCK: {
    name: "1970s Oil & Stagflation Spike",
    equityShockPct: -18.0,
    debtYieldBps: 250,
    commodityShockPct: 45.0, // Commodities surge
    currencyDevaluationPct: -6.0,
    inflationShockPct: 5.0,
  },
  EM_BULL_CYCLE: {
    name: "Emerging Markets Liquidity Boom",
    equityShockPct: 24.0,
    debtYieldBps: -50,
    commodityShockPct: 12.0,
    currencyDevaluationPct: 5.0,
    inflationShockPct: 0.5,
  },
};

export interface MetricComparisonPoint<T = number> {
  metric: string;
  current: T;
  scenario: T;
  delta: number;
  deltaPercent?: number;
  favorable: boolean;
}

export interface ScenarioComparisonResult {
  scenarioId: string;
  scenarioName: string;
  basePortfolioId: string;
  currentHoldingsCount: number;
  scenarioHoldingsCount: number;
  metrics: {
    totalValue: MetricComparisonPoint<number>;
    expectedReturn: MetricComparisonPoint<number>;
    volatility: MetricComparisonPoint<number>;
    sharpeRatio: MetricComparisonPoint<number>;
    maxDrawdown: MetricComparisonPoint<number>;
    largestHoldingWeight: MetricComparisonPoint<number>;
    healthScore: MetricComparisonPoint<number>;
    goalSuccessProbability: MetricComparisonPoint<number>;
    estimatedTaxImpact: number;
  };
  narrativeSummary: string;
  methodologyVersion: string;
}

/**
 * Creates an immutable What-If scenario clone of a base portfolio.
 * Never mutates live production data.
 */
export function clonePortfolioToScenario(
  baseHoldings: PortfolioHolding[],
  basePortfolioId: string,
  name: string = "Alternative Allocation Sandbox"
): WhatIfScenario {
  return {
    id: `scenario_${basePortfolioId}_${Date.now()}`,
    basePortfolioId,
    name,
    createdAt: new Date().toISOString(),
    changes: [],
    assumptions: {},
  };
}

/**
 * Pure immutable transformation: applies scenario modifications onto a deep-cloned holding array.
 */
export function applyScenarioChanges(
  baseHoldings: PortfolioHolding[],
  scenario: WhatIfScenario
): PortfolioHolding[] {
  // Deep clone to ensure production holdings cannot be mutated
  const cloned: PortfolioHolding[] = JSON.parse(JSON.stringify(baseHoldings));

  // 1. Apply macro shocks from assumptions
  const eqShock = (scenario.assumptions?.equityShockPct ?? 0) / 100;
  const debtYieldDelta = (scenario.assumptions?.debtYieldBps ?? 0) / 10000;
  const debtShock = -4.0 * debtYieldDelta; // 4-year modified duration
  const commShock = (scenario.assumptions?.commodityShockPct ?? 0) / 100;
  const fxShock = (scenario.assumptions?.currencyDevaluationPct ?? 0) / 100;

  cloned.forEach((h) => {
    const cat = normalizeCategory(h.assetClass);
    let cur = Number(h.currentValue) || 0;

    if (cat === "Stocks" || cat === "Mutual Funds") {
      cur *= 1 + eqShock;
    } else if (cat === "Bonds") {
      cur *= 1 + debtShock;
    } else if (cat === "Alternatives") {
      cur *= 1 + commShock;
    }

    if (h.currency && h.currency !== "INR") {
      cur *= 1 + fxShock;
    }

    h.currentValue = Math.max(0, Math.round(cur)).toString();
  });

  // 2. Apply discrete rebalancing changes (buy, sell, overweight, underweight)
  (scenario.changes || []).forEach((change) => {
    if (change.type === "BUY" && change.targetHoldingId) {
      const target = cloned.find((h) => h.id === change.targetHoldingId);
      if (target) {
        const cur = Number(target.currentValue) || 0;
        const add = change.deltaAmount ?? (cur * (change.deltaPercent ?? 0.10));
        target.currentValue = (cur + add).toString();
      }
    } else if (change.type === "SELL" && change.targetHoldingId) {
      const target = cloned.find((h) => h.id === change.targetHoldingId);
      if (target) {
        const cur = Number(target.currentValue) || 0;
        const sub = change.deltaAmount ?? (cur * (change.deltaPercent ?? 0.10));
        target.currentValue = Math.max(0, cur - sub).toString();
      }
    } else if (change.type === "CASH_INFLOW") {
      const cash = cloned.find((h) => normalizeCategory(h.assetClass) === "Cash");
      const amt = change.deltaAmount ?? 100000;
      if (cash) {
        cash.currentValue = ((Number(cash.currentValue) || 0) + amt).toString();
      } else {
        cloned.push({
          id: `cash_${Date.now()}`,
          assetName: "Sandbox Liquidity",
          assetClass: "Cash",
          ticker: "CASH",
          quantity: "1",
          investedValue: amt.toString(),
          currentValue: amt.toString(),
          targetWeight: "10",
          notes: "Sandbox cash buffer",
        });
      }
    }
  });

  return cloned;
}

/**
 * Performs a rigorous side-by-side comparison of CURRENT vs SCENARIO portfolios.
 */
export function compareScenarioSideBySide(
  baseHoldings: PortfolioHolding[],
  scenarioHoldings: PortfolioHolding[],
  scenarioName: string = "Proposed Scenario",
  basePortfolioId: string = "default-portfolio"
): ScenarioComparisonResult {
  const currentVal = baseHoldings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );
  const scenarioVal = scenarioHoldings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );

  // Health Scores
  const curHealth = calculateHealthScore(baseHoldings, 0, basePortfolioId);
  const scnHealth = calculateHealthScore(scenarioHoldings, 0, `scn_${basePortfolioId}`);

  // Concentration (largest position weight)
  const getLargestWeight = (holdings: PortfolioHolding[], total: number) => {
    if (total <= 0 || holdings.length === 0) return 0;
    const max = Math.max(...holdings.map((h) => Number(h.currentValue) || 0));
    return parseFloat((max / total).toFixed(4));
  };

  const curLargest = getLargestWeight(baseHoldings, currentVal);
  const scnLargest = getLargestWeight(scenarioHoldings, scenarioVal);

  // Approximate portfolio expected return based on asset class weights
  const getExpectedReturn = (holdings: PortfolioHolding[], total: number) => {
    if (total <= 0) return 0.08;
    let weightedReturn = 0;
    holdings.forEach((h) => {
      const w = (Number(h.currentValue) || 0) / total;
      const cat = normalizeCategory(h.assetClass);
      const r = cat === "Stocks" ? 0.13 : cat === "Bonds" ? 0.075 : cat === "Cash" ? 0.06 : 0.10;
      weightedReturn += w * r;
    });
    return parseFloat((weightedReturn * 100).toFixed(2));
  };

  const curExpReturn = getExpectedReturn(baseHoldings, currentVal);
  const scnExpReturn = getExpectedReturn(scenarioHoldings, scenarioVal);

  // Approximate volatility
  const curVol = curLargest > 0.35 ? 18.5 : 13.8;
  const scnVol = scnLargest > 0.35 ? 18.5 : 13.8;

  // Approximate Sharpe
  const rf = 6.5; // 6.5%
  const curSharpe = parseFloat(((curExpReturn - rf) / curVol).toFixed(2));
  const scnSharpe = parseFloat(((scnExpReturn - rf) / scnVol).toFixed(2));

  // Max Drawdown estimate
  const curDrawdown = curLargest > 0.4 ? -22.5 : -14.2;
  const scnDrawdown = scnLargest > 0.4 ? -22.5 : -14.2;

  // Goal success probability estimate
  const curGoalProb = Math.min(99, Math.max(20, Math.round(curHealth.healthScore * 0.95)));
  const scnGoalProb = Math.min(99, Math.max(20, Math.round(scnHealth.healthScore * 0.95)));

  // Estimated tax impact: if positions were sold down, compute capital gains tax
  let realizedGainsFromSales = 0;
  baseHoldings.forEach((baseH) => {
    const scnH = scenarioHoldings.find((s) => s.id === baseH.id);
    if (scnH) {
      const soldVal = (Number(baseH.currentValue) || 0) - (Number(scnH.currentValue) || 0);
      if (soldVal > 0 && (Number(baseH.currentValue) || 0) > (Number(baseH.investedValue) || 0)) {
        const gainRatio =
          ((Number(baseH.currentValue) || 0) - (Number(baseH.investedValue) || 0)) /
          (Number(baseH.currentValue) || 1);
        realizedGainsFromSales += soldVal * gainRatio;
      }
    }
  });

  const taxEstimate = calculateStatutoryCapitalGainsTax({
    realizedSTCG: realizedGainsFromSales * 0.4,
    realizedLTCG: realizedGainsFromSales * 0.6,
  });

  const valDelta = scenarioVal - currentVal;
  const valDeltaPct = currentVal > 0 ? parseFloat(((valDelta / currentVal) * 100).toFixed(2)) : 0;

  return {
    scenarioId: `scn_comp_${Date.now()}`,
    scenarioName,
    basePortfolioId,
    currentHoldingsCount: baseHoldings.length,
    scenarioHoldingsCount: scenarioHoldings.length,
    metrics: {
      totalValue: {
        metric: "Portfolio Valuation",
        current: currentVal,
        scenario: scenarioVal,
        delta: valDelta,
        deltaPercent: valDeltaPct,
        favorable: valDelta >= 0,
      },
      expectedReturn: {
        metric: "Expected Annual Return",
        current: curExpReturn,
        scenario: scnExpReturn,
        delta: parseFloat((scnExpReturn - curExpReturn).toFixed(2)),
        favorable: scnExpReturn >= curExpReturn,
      },
      volatility: {
        metric: "Annualized Volatility",
        current: curVol,
        scenario: scnVol,
        delta: parseFloat((scnVol - curVol).toFixed(2)),
        favorable: scnVol <= curVol,
      },
      sharpeRatio: {
        metric: "Sharpe Ratio",
        current: curSharpe,
        scenario: scnSharpe,
        delta: parseFloat((scnSharpe - curSharpe).toFixed(2)),
        favorable: scnSharpe >= curSharpe,
      },
      maxDrawdown: {
        metric: "Projected Max Drawdown",
        current: curDrawdown,
        scenario: scnDrawdown,
        delta: parseFloat((scnDrawdown - curDrawdown).toFixed(2)),
        favorable: scnDrawdown >= curDrawdown,
      },
      largestHoldingWeight: {
        metric: "Single-Asset Concentration",
        current: parseFloat((curLargest * 100).toFixed(1)),
        scenario: parseFloat((scnLargest * 100).toFixed(1)),
        delta: parseFloat(((scnLargest - curLargest) * 100).toFixed(1)),
        favorable: scnLargest <= curLargest,
      },
      healthScore: {
        metric: "Portfolio Health Score",
        current: curHealth.healthScore,
        scenario: scnHealth.healthScore,
        delta: scnHealth.healthScore - curHealth.healthScore,
        favorable: scnHealth.healthScore >= curHealth.healthScore,
      },
      goalSuccessProbability: {
        metric: "Goal Success Probability",
        current: curGoalProb,
        scenario: scnGoalProb,
        delta: scnGoalProb - curGoalProb,
        favorable: scnGoalProb >= curGoalProb,
      },
      estimatedTaxImpact: taxEstimate.totalTaxLiability,
    },
    narrativeSummary:
      scnHealth.healthScore >= curHealth.healthScore
        ? `Proposed scenario improves overall portfolio resilience. Health index shifts from ${curHealth.healthScore} to ${scnHealth.healthScore} (+${scnHealth.healthScore - curHealth.healthScore} pts), with an estimated rebalancing tax friction of ₹${Math.round(taxEstimate.totalTaxLiability).toLocaleString("en-IN")}.`
        : `Scenario increases portfolio fragility (Health drops to ${scnHealth.healthScore}). Fiduciary review advised prior to implementation.`,
    methodologyVersion: SCENARIO_ENGINE_METHODOLOGY_VERSION,
  };
}

/**
 * Simulates portfolio value and distribution under macro shocks (Legacy & Preset compatibility)
 */
export function simulateScenario(
  holdings: PortfolioHolding[],
  params: ScenarioShockParams = PRESET_SCENARIOS.TECH_CORRECTION,
  portfolioId: string = "default-portfolio"
): ScenarioResult {
  const initialValue = holdings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );

  if (initialValue <= 0 || holdings.length === 0) {
    return {
      portfolioId,
      scenarioName: params.name,
      initialValue: 0,
      projectedValue: 0,
      percentChange: 0,
      postShockVolatility: 15,
      postShockSharpe: 0.5,
      goalSuccessProbability: 50,
      valueDistribution: [],
      advisoryCommentary: "No portfolio valuation available to simulate.",
    };
  }

  // Calculate weighted impact by asset class
  let projectedValue = 0;

  holdings.forEach((h) => {
    const val = Number(h.currentValue) || 0;
    const cat = normalizeCategory(h.assetClass);

    let impactRate = 0;
    if (cat === "Stocks" || cat === "Mutual Funds") {
      impactRate = params.equityShockPct / 100;
    } else if (cat === "Bonds") {
      // Modified duration approximation: -Duration * (dY)
      const yieldDelta = params.debtYieldBps / 10000;
      impactRate = -4.0 * yieldDelta;
    } else if (cat === "Alternatives") {
      impactRate = params.commodityShockPct / 100;
    } else if (cat === "Cash") {
      // Cash retains capital nominal value
      impactRate = 0;
    }

    const postVal = val * (1 + impactRate);
    projectedValue += Math.max(0, postVal);
  });

  const percentChange = parseFloat(
    (((projectedValue - initialValue) / initialValue) * 100).toFixed(2)
  );

  const impliedVol = Math.abs(percentChange) > 15 ? 22.5 : 14.8;
  const postShockSharpe = parseFloat(
    (percentChange >= 0 ? 1.15 : Math.max(-0.5, 0.85 + percentChange / 50)).toFixed(2)
  );

  const p5 = Math.round(projectedValue * (1 - (impliedVol * 1.645) / 100));
  const p25 = Math.round(projectedValue * (1 - (impliedVol * 0.675) / 100));
  const p50 = Math.round(projectedValue);
  const p75 = Math.round(projectedValue * (1 + (impliedVol * 0.675) / 100));
  const p95 = Math.round(projectedValue * (1 + (impliedVol * 1.645) / 100));

  const valueDistribution: ScenarioDistributionPoint[] = [
    { percentile: 5, value: p5 },
    { percentile: 25, value: p25 },
    { percentile: 50, value: p50 },
    { percentile: 75, value: p75 },
    { percentile: 95, value: p95 },
  ];

  const goalSuccessProbability = Math.max(
    25,
    Math.min(99, Math.round(85 + percentChange * 0.8))
  );

  let advisory = "";
  if (percentChange <= -15) {
    advisory = `Severe stress test impact: Portfolio projected to contract by ${Math.abs(percentChange)}% in this scenario, with tail risk (P5) dropping to ₹${p5.toLocaleString("en-IN")}. Goal success probability declines to ${goalSuccessProbability}%. Recommend increasing high-quality short-duration debt or defensive gold allocations.`;
  } else if (percentChange < 0) {
    advisory = `Moderate downside: Portfolio absorbs shock with a ${Math.abs(percentChange)}% contraction (P50: ₹${p50.toLocaleString("en-IN")}). Risk parameters remain within fiduciary tolerances, but discretionary rebalancing is recommended.`;
  } else {
    advisory = `Resilient expansion: Macro conditions expand portfolio NAV by +${percentChange}%. Ensure disciplined profit booking into cash and debt rebalancing to protect accrued gains.`;
  }

  return {
    portfolioId,
    scenarioName: params.name,
    initialValue: Math.round(initialValue),
    projectedValue: Math.round(projectedValue),
    percentChange,
    postShockVolatility: impliedVol,
    postShockSharpe,
    goalSuccessProbability,
    valueDistribution,
    advisoryCommentary: advisory,
  };
}
