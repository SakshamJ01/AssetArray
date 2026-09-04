import { SimpleHolding } from "./rebalancer";

export interface CrisisScenario {
  id: string;
  name: string;
  yearReference: string;
  description: string;
  impactShocks: {
    Equity: number; // percentage change, e.g. -42
    Debt: number; // percentage change, e.g. +14
    Alternative: number; // percentage change, e.g. +22
    Cash?: number;
  };
  historicalRecoveryMonths: number;
  fiduciaryCommentary: string;
}

export const CRISIS_SCENARIOS: CrisisScenario[] = [
  {
    id: "gfc_2008",
    name: "2008 Global Financial Crisis",
    yearReference: "2008 - 2009",
    description: "Systemic banking contagion triggering aggressive flight to sovereign bonds and bullion.",
    impactShocks: {
      Equity: -42.0,
      Debt: 12.0,
      Alternative: 18.0,
    },
    historicalRecoveryMonths: 28,
    fiduciaryCommentary: "Sovereign duration buffer and precious metals dampen deep equity drawdowns.",
  },
  {
    id: "tech_reset",
    name: "Tech & Growth Valuation Reset",
    yearReference: "2022 Style",
    description: "Multiple contraction across high-multiple growth equities and speculative technology.",
    impactShocks: {
      Equity: -28.0,
      Debt: -6.0,
      Alternative: -5.0,
    },
    historicalRecoveryMonths: 15,
    fiduciaryCommentary: "Value tilt, dividend yield, and private credit insulate against high-beta compression.",
  },
  {
    id: "stagflation_1970s",
    name: "1970s Supply Shock Stagflation",
    yearReference: "Supply Shock",
    description: "Persistent headline inflation combined with decelerating economic output and bond selloff.",
    impactShocks: {
      Equity: -22.0,
      Debt: -18.0,
      Alternative: 32.0,
    },
    historicalRecoveryMonths: 34,
    fiduciaryCommentary: "Standard 60/40 correlations break down; gold and commodities become vital capital anchors.",
  },
  {
    id: "rate_hike_shock",
    name: "Rapid Rate Hike Shock (+250 bps)",
    yearReference: "Aggressive Tightening",
    description: "Central bank terminal rate revisions penalizing longer duration bonds and equities.",
    impactShocks: {
      Equity: -14.0,
      Debt: -12.0,
      Alternative: -2.0,
    },
    historicalRecoveryMonths: 11,
    fiduciaryCommentary: "Low-duration floating-rate notes and liquid reserves allow opportunistic re-entry.",
  },
];

export interface StressTestImpactItem {
  assetClass: string;
  initialValue: number;
  shockPercentage: number;
  projectedValue: number;
  dollarChange: number;
}

export interface StressTestResult {
  scenario: CrisisScenario;
  initialTotalAum: number;
  projectedTotalAum: number;
  totalDrawdownDollars: number;
  totalDrawdownPercentage: number;
  resilienceRating: "AAA Fiduciary" | "AA Resilient" | "A Moderate" | "BBB Vulnerable";
  projectedRecoveryMonths: number;
  breakdown: StressTestImpactItem[];
  fiduciaryRecommendation: string;
}

export function runStressTest(
  holdings: SimpleHolding[],
  scenario: CrisisScenario = CRISIS_SCENARIOS[0]
): StressTestResult {
  const initialTotal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  if (initialTotal <= 0) {
    return {
      scenario,
      initialTotalAum: 0,
      projectedTotalAum: 0,
      totalDrawdownDollars: 0,
      totalDrawdownPercentage: 0,
      resilienceRating: "AAA Fiduciary",
      projectedRecoveryMonths: 0,
      breakdown: [],
      fiduciaryRecommendation: "No tracked holdings to stress test.",
    };
  }

  // Aggregate current valuation by normalized asset class
  const classValuations: Record<string, number> = {
    Equity: 0,
    Debt: 0,
    Alternative: 0,
  };

  holdings.forEach((h) => {
    const rawClass = (h.assetClass || "Alternative").trim().toLowerCase();
    const normalizedClass =
      rawClass.includes("stock") || rawClass.includes("equity")
        ? "Equity"
        : rawClass.includes("bond") || rawClass.includes("debt")
        ? "Debt"
        : "Alternative";

    classValuations[normalizedClass] += Number(h.currentValue) || 0;
  });

  let projectedTotal = 0;
  const breakdown: StressTestImpactItem[] = Object.keys(classValuations).map((cls) => {
    const initialVal = classValuations[cls] || 0;
    const shock = scenario.impactShocks[cls as keyof typeof scenario.impactShocks] || 0;
    const projVal = initialVal * (1 + shock / 100);
    const change = projVal - initialVal;
    projectedTotal += projVal;

    return {
      assetClass: cls,
      initialValue: parseFloat(initialVal.toFixed(2)),
      shockPercentage: shock,
      projectedValue: parseFloat(projVal.toFixed(2)),
      dollarChange: parseFloat(change.toFixed(2)),
    };
  });

  const totalDrawdownDollars = initialTotal - projectedTotal;
  const totalDrawdownPct = (totalDrawdownDollars / initialTotal) * 100;

  // Derive Fiduciary Resilience Rating
  let resilienceRating: StressTestResult["resilienceRating"] = "AAA Fiduciary";
  if (totalDrawdownPct > 30) {
    resilienceRating = "BBB Vulnerable";
  } else if (totalDrawdownPct > 20) {
    resilienceRating = "A Moderate";
  } else if (totalDrawdownPct > 10) {
    resilienceRating = "AA Resilient";
  } else {
    resilienceRating = "AAA Fiduciary";
  }

  // Calculate estimated recovery months based on scenario base and portfolio drawdown depth
  const recoveryRatio = Math.max(0.4, totalDrawdownPct / 25);
  const projectedRecoveryMonths = Math.round(scenario.historicalRecoveryMonths * recoveryRatio);

  let recommendation = scenario.fiduciaryCommentary;
  if (totalDrawdownPct > 25) {
    recommendation += " High drawdown vulnerability detected. Recommend increasing sovereign debt or gold hedge to at least 25% of total wealth.";
  }

  return {
    scenario,
    initialTotalAum: parseFloat(initialTotal.toFixed(2)),
    projectedTotalAum: parseFloat(projectedTotal.toFixed(2)),
    totalDrawdownDollars: parseFloat(totalDrawdownDollars.toFixed(2)),
    totalDrawdownPercentage: parseFloat(totalDrawdownPct.toFixed(1)),
    resilienceRating,
    projectedRecoveryMonths,
    breakdown,
    fiduciaryRecommendation: recommendation,
  };
}
