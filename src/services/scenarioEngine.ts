import {
  ScenarioShockParams,
  ScenarioResult,
  ScenarioDistributionPoint,
  PortfolioHolding,
} from "../types/wealth";
import { normalizeCategory } from "./attribution";

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

/**
 * Simulates portfolio value and distribution under macro shocks
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
      // Assuming 4-year average bond duration
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

  // Approximate post-shock distribution percentiles
  // High negative shocks widen the distribution tail
  const impliedVol = Math.abs(percentChange) > 15 ? 22.5 : 14.8;
  const postShockSharpe = parseFloat(
    (percentChange >= 0 ? 1.15 : Math.max(-0.5, 0.85 + percentChange / 50)).toFixed(2)
  );

  // Compute 5 percentiles: P5, P25, P50, P75, P95
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

  // Baseline goal success prob drops with negative shock
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
