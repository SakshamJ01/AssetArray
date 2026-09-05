import {
  AttributionCategoryBreakdown,
  AttributionResult,
  PortfolioHolding,
} from "../types/wealth";

export interface BenchmarkProfile {
  symbol: string;
  name: string;
  categoryWeights: Record<string, number>; // e.g. { "Stocks": 0.65, "Bonds": 0.35 }
  categoryReturns: Record<string, number>; // e.g. { "Stocks": 0.12, "Bonds": 0.065 }
}

export const STANDARD_BENCHMARKS: Record<string, BenchmarkProfile> = {
  NIFTY_50: {
    symbol: "NIFTY50",
    name: "Nifty 50 Index (India Core)",
    categoryWeights: {
      Stocks: 0.95,
      Cash: 0.05,
    },
    categoryReturns: {
      Stocks: 0.114,
      Cash: 0.062,
    },
  },
  BALANCED_HYBRID: {
    symbol: "BALANCED_65_35",
    name: "CRISIL Hybrid 65:35 Aggressive",
    categoryWeights: {
      Stocks: 0.65,
      Bonds: 0.30,
      Cash: 0.05,
    },
    categoryReturns: {
      Stocks: 0.114,
      Bonds: 0.072,
      Cash: 0.062,
    },
  },
  SPY_500: {
    symbol: "SPY",
    name: "S&P 500 Total Return (US Core)",
    categoryWeights: {
      Stocks: 0.98,
      Cash: 0.02,
    },
    categoryReturns: {
      Stocks: 0.138,
      Cash: 0.048,
    },
  },
  CONSERVATIVE_DEBT: {
    symbol: "DEBT_HYBRID",
    name: "Conservative Debt Hybrid",
    categoryWeights: {
      Bonds: 0.80,
      Cash: 0.15,
      Stocks: 0.05,
    },
    categoryReturns: {
      Bonds: 0.074,
      Cash: 0.062,
      Stocks: 0.114,
    },
  },
};

/**
 * Normalizes holding asset class into standard category buckets
 */
export function normalizeCategory(assetClass: string): string {
  const raw = (assetClass || "").toLowerCase();
  if (
    raw.includes("gold") ||
    raw.includes("silver") ||
    raw.includes("commodity") ||
    raw.includes("real estate") ||
    raw.includes("reit") ||
    raw.includes("crypto") ||
    raw.includes("alternative")
  ) {
    return "Alternatives";
  }
  if (raw.includes("stock") || raw.includes("equity")) return "Stocks";
  if (raw.includes("bond") || raw.includes("debt") || raw.includes("fixed") || raw.includes("gilt")) return "Bonds";
  if (raw.includes("mutual") || raw.includes("fund") || raw.includes("etf")) return "Mutual Funds";
  if (raw.includes("cash") || raw.includes("liquid") || raw.includes("money")) return "Cash";
  return "Alternatives";
}

/**
 * Calculates Brinson-Fachler Performance Attribution
 *
 * Allocation Effect = (wp - wb) * (Rb - R_total_b)
 * Selection Effect = wb * (rp - Rb)
 * Interaction Effect = (wp - wb) * (rp - Rb)
 * Total Active Return = Allocation + Selection + Interaction = rp_total - Rb_total
 */
export function calculateAttribution(
  holdings: PortfolioHolding[],
  benchmark: BenchmarkProfile = STANDARD_BENCHMARKS.BALANCED_HYBRID,
  portfolioId: string = "default-portfolio"
): AttributionResult {
  const totalVal = holdings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );

  // Group portfolio holdings by normalized category
  const portfolioByCategory: Record<
    string,
    { currentVal: number; investedVal: number }
  > = {};

  holdings.forEach((h) => {
    const cat = normalizeCategory(h.assetClass);
    if (!portfolioByCategory[cat]) {
      portfolioByCategory[cat] = { currentVal: 0, investedVal: 0 };
    }
    portfolioByCategory[cat].currentVal += Number(h.currentValue) || 0;
    portfolioByCategory[cat].investedVal += Number(h.investedValue) || 0;
  });

  // Calculate Benchmark total return (sum of wb_i * Rb_i)
  let benchmarkTotalReturn = 0;
  const benchmarkCategories = Object.keys(benchmark.categoryWeights);
  benchmarkCategories.forEach((cat) => {
    const wb = benchmark.categoryWeights[cat] || 0;
    const Rb = benchmark.categoryReturns[cat] || 0;
    benchmarkTotalReturn += wb * Rb;
  });

  // Combine all categories across portfolio and benchmark
  const allCategories = Array.from(
    new Set([
      ...Object.keys(portfolioByCategory),
      ...Object.keys(benchmark.categoryWeights),
    ])
  );

  let totalAllocEffect = 0;
  let totalSelectEffect = 0;
  let totalInteractEffect = 0;
  let portfolioTotalReturn = 0;

  const breakdown: AttributionCategoryBreakdown[] = allCategories.map((cat) => {
    const portData = portfolioByCategory[cat] || { currentVal: 0, investedVal: 0 };
    const wp = totalVal > 0 ? portData.currentVal / totalVal : 0;
    
    // Category return for portfolio: (current - invested) / invested, fallback to benchmark return
    let rp = benchmark.categoryReturns[cat] || 0.08;
    if (portData.investedVal > 0) {
      rp = (portData.currentVal - portData.investedVal) / portData.investedVal;
    }

    portfolioTotalReturn += wp * rp;

    const wb = benchmark.categoryWeights[cat] || 0;
    const Rb = benchmark.categoryReturns[cat] || 0.07;

    // Brinson-Fachler Decomposition
    const alloc = (wp - wb) * (Rb - benchmarkTotalReturn);
    const select = wb * (rp - Rb);
    const interact = (wp - wb) * (rp - Rb);
    const totalCatActive = alloc + select + interact;

    totalAllocEffect += alloc;
    totalSelectEffect += select;
    totalInteractEffect += interact;

    return {
      category: cat,
      portfolioWeight: parseFloat(wp.toFixed(4)),
      benchmarkWeight: parseFloat(wb.toFixed(4)),
      portfolioReturn: parseFloat(rp.toFixed(4)),
      benchmarkReturn: parseFloat(Rb.toFixed(4)),
      allocationEffect: parseFloat(alloc.toFixed(4)),
      selectionEffect: parseFloat(select.toFixed(4)),
      interactionEffect: parseFloat(interact.toFixed(4)),
      totalActiveContribution: parseFloat(totalCatActive.toFixed(4)),
    };
  });

  const totalActiveReturn = portfolioTotalReturn - benchmarkTotalReturn;

  // Generate plain-language explainability synthesis
  let explanation = "";
  const diffBps = Math.round(totalActiveReturn * 10000);
  const allocBps = Math.round(totalAllocEffect * 10000);
  const selectBps = Math.round(totalSelectEffect * 10000);

  if (diffBps >= 0) {
    explanation = `Portfolio generated +${(totalActiveReturn * 100).toFixed(2)}% (+${diffBps} bps) of alpha against ${benchmark.name}. Asset allocation contributed ${allocBps >= 0 ? "+" : ""}${allocBps} bps, while security selection delivered ${selectBps >= 0 ? "+" : ""}${selectBps} bps.`;
  } else {
    explanation = `Portfolio trailed ${benchmark.name} by ${(Math.abs(totalActiveReturn) * 100).toFixed(2)}% (${diffBps} bps). Allocation drag contributed ${allocBps} bps, while asset selection drove ${selectBps} bps.`;
  }

  return {
    portfolioId,
    benchmarkSymbol: benchmark.symbol,
    benchmarkName: benchmark.name,
    portfolioReturn: parseFloat(portfolioTotalReturn.toFixed(4)),
    benchmarkReturn: parseFloat(benchmarkTotalReturn.toFixed(4)),
    totalActiveReturn: parseFloat(totalActiveReturn.toFixed(4)),
    summary: {
      allocationEffect: parseFloat(totalAllocEffect.toFixed(4)),
      selectionEffect: parseFloat(totalSelectEffect.toFixed(4)),
      interactionEffect: parseFloat(totalInteractEffect.toFixed(4)),
    },
    breakdown,
    narrativeExplanation: explanation,
  };
}
