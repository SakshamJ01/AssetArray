import {
  AttributionCategoryBreakdown,
  AttributionResult,
  PortfolioHolding,
  PerformanceQuality,
} from "../types/wealth";

export const ATTRIBUTION_METHODOLOGY_VERSION = "brinson-fachler-v1.1";

export interface BenchmarkProfile {
  symbol: string;
  name: string;
  provider?: string;
  currency?: string;
  returnType?: "TOTAL_RETURN" | "PRICE_RETURN";
  isSimulated?: boolean;
  categoryWeights: Record<string, number>; // e.g. { "Stocks": 0.65, "Bonds": 0.35 }
  categoryReturns: Record<string, number>; // e.g. { "Stocks": 0.12, "Bonds": 0.065 }
}

export const STANDARD_BENCHMARKS: Record<string, BenchmarkProfile> = {
  NIFTY_50: {
    symbol: "NIFTY50",
    name: "Nifty 50 Total Return Index",
    provider: "NSE Indices",
    currency: "INR",
    returnType: "TOTAL_RETURN",
    isSimulated: true,
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
    name: "CRISIL Hybrid 65:35 Aggressive Index",
    provider: "CRISIL",
    currency: "INR",
    returnType: "TOTAL_RETURN",
    isSimulated: true,
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
    name: "S&P 500 Total Return Index",
    provider: "S&P Dow Jones Indices",
    currency: "USD",
    returnType: "TOTAL_RETURN",
    isSimulated: true,
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
    name: "Conservative Debt Hybrid Index",
    provider: "CRISIL / CCIL",
    currency: "INR",
    returnType: "TOTAL_RETURN",
    isSimulated: true,
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
 * Options for attribution calculation
 */
export interface AttributionOptions {
  customCategoryReturns?: Record<string, number>; // Time-weighted or cash-flow aware returns per category
  portfolioCurrency?: string; // Portfolio base currency e.g. "INR"
  tolerance?: number; // Tolerance for active return reconciliation check (default 1e-4)
}

/**
 * Calculates Brinson-Fachler Performance Attribution
 *
 * Mathematical Identity:
 * Allocation Effect   = (wp_i - wb_i) * (Rb_i - R_total_b)
 * Selection Effect    = wb_i * (rp_i - Rb_i)
 * Interaction Effect  = (wp_i - wb_i) * (rp_i - Rb_i)
 * Total Active Return = Portfolio Return - Benchmark Return = Allocation + Selection + Interaction
 */
export function calculateAttribution(
  holdings: PortfolioHolding[],
  benchmark: BenchmarkProfile = STANDARD_BENCHMARKS.BALANCED_HYBRID,
  portfolioId: string = "default-portfolio",
  options?: AttributionOptions
): AttributionResult {
  const warnings: string[] = [];
  const tolerance = options?.tolerance ?? 1e-4;

  const totalVal = holdings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );

  if (totalVal <= 0 || holdings.length === 0) {
    const benchmarkCategories = Object.keys(benchmark.categoryWeights || {});
    let benchmarkTotalReturn = 0;
    benchmarkCategories.forEach((cat) => {
      const wb = benchmark.categoryWeights[cat] || 0;
      const Rb = benchmark.categoryReturns[cat] || 0;
      benchmarkTotalReturn += wb * Rb;
    });

    let totalAllocEffect = 0;
    let totalSelectEffect = 0;
    let totalInteractEffect = 0;

    const breakdown: AttributionCategoryBreakdown[] = benchmarkCategories.map((cat) => {
      const wb = benchmark.categoryWeights[cat] || 0;
      const Rb = benchmark.categoryReturns[cat] || 0;
      const alloc = (0 - wb) * (Rb - benchmarkTotalReturn);
      const select = 0;
      const interact = 0;
      totalAllocEffect += alloc;

      return {
        category: cat,
        portfolioWeight: 0,
        benchmarkWeight: parseFloat(wb.toFixed(4)),
        portfolioReturn: 0,
        benchmarkReturn: parseFloat(Rb.toFixed(4)),
        allocationEffect: parseFloat(alloc.toFixed(4)),
        selectionEffect: 0,
        interactionEffect: 0,
        totalActiveContribution: parseFloat(alloc.toFixed(4)),
      };
    });

    const activeReturn = -benchmarkTotalReturn;

    return {
      portfolioId,
      benchmarkSymbol: benchmark.symbol,
      benchmarkName: benchmark.name,
      portfolioReturn: 0,
      benchmarkReturn: parseFloat(benchmarkTotalReturn.toFixed(4)),
      totalActiveReturn: parseFloat(activeReturn.toFixed(4)),
      summary: {
        allocationEffect: parseFloat(totalAllocEffect.toFixed(4)),
        selectionEffect: parseFloat(totalSelectEffect.toFixed(4)),
        interactionEffect: parseFloat(totalInteractEffect.toFixed(4)),
      },
      breakdown,
      narrativeExplanation: `Portfolio holds no assets; underperformed ${benchmark.name} by ${(benchmarkTotalReturn * 100).toFixed(2)}%.`,
      quality: "INSUFFICIENT_DATA",
      methodologyVersion: ATTRIBUTION_METHODOLOGY_VERSION,
      isReconciled: true,
      warnings: ["Portfolio has zero valuation or no holdings."],
    };
  }

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
  const benchmarkCategories = Object.keys(benchmark.categoryWeights || {});
  benchmarkCategories.forEach((cat) => {
    const wb = benchmark.categoryWeights[cat] || 0;
    const Rb = benchmark.categoryReturns[cat] || 0;
    benchmarkTotalReturn += wb * Rb;
  });

  // Combine all categories across portfolio and benchmark
  const allCategories = Array.from(
    new Set([
      ...Object.keys(portfolioByCategory),
      ...benchmarkCategories,
    ])
  );

  let totalAllocEffect = 0;
  let totalSelectEffect = 0;
  let totalInteractEffect = 0;
  let portfolioTotalReturn = 0;

  const breakdown: AttributionCategoryBreakdown[] = allCategories.map((cat) => {
    const portData = portfolioByCategory[cat] || { currentVal: 0, investedVal: 0 };
    const wp = totalVal > 0 ? portData.currentVal / totalVal : 0;
    const wb = benchmark.categoryWeights[cat] || 0;
    const hasBenchmarkReturn = typeof benchmark.categoryReturns[cat] === "number";
    const Rb = hasBenchmarkReturn ? benchmark.categoryReturns[cat] : 0;

    if (!hasBenchmarkReturn && wb > 0) {
      warnings.push(`Benchmark return for category '${cat}' is missing; assigned 0.0.`);
    }

    // Determine portfolio category return rp
    let rp = 0;
    if (options?.customCategoryReturns && typeof options.customCategoryReturns[cat] === "number") {
      rp = options.customCategoryReturns[cat];
    } else if (portData.investedVal > 0) {
      rp = (portData.currentVal - portData.investedVal) / portData.investedVal;
    } else if (portData.currentVal > 0) {
      // Cost basis is zero; uncalculated return
      rp = 0;
      warnings.push(`Invested value for category '${cat}' is zero; return defaulted to 0.0.`);
    }

    portfolioTotalReturn += wp * rp;

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

  const rawActiveReturn = portfolioTotalReturn - benchmarkTotalReturn;
  const rawSumEffects = totalAllocEffect + totalSelectEffect + totalInteractEffect;
  const isReconciled = Math.abs(rawSumEffects - rawActiveReturn) < tolerance;

  if (!isReconciled) {
    warnings.push(
      `Attribution identity gap: sum of effects (${rawSumEffects.toFixed(6)}) differs from active return (${rawActiveReturn.toFixed(6)}) by ${Math.abs(rawSumEffects - rawActiveReturn).toFixed(6)}.`
    );
  }

  const portCurrency = options?.portfolioCurrency || "INR";
  const benchCurrency = benchmark.currency || "INR";
  if (portCurrency !== benchCurrency) {
    warnings.push(
      `Currency mismatch: portfolio is in '${portCurrency}' while benchmark '${benchmark.name}' is in '${benchCurrency}'. Direct active return comparisons may be influenced by FX rate fluctuations.`
    );
  }

  // Quality assessment
  let quality: PerformanceQuality = "HIGH";
  if (warnings.length > 0) {
    quality = warnings.some((w) => w.includes("missing") || w.includes("identity gap"))
      ? "INSUFFICIENT_DATA"
      : warnings.length > 2
      ? "LOW"
      : "MEDIUM";
  }

  // Plain-language explainability synthesis
  let explanation = "";
  const diffBps = Math.round(rawActiveReturn * 10000);
  const allocBps = Math.round(totalAllocEffect * 10000);
  const selectBps = Math.round(totalSelectEffect * 10000);

  if (diffBps >= 0) {
    explanation = `Portfolio generated +${(rawActiveReturn * 100).toFixed(2)}% (+${diffBps} bps) of active return against ${benchmark.name}. Asset allocation contributed ${allocBps >= 0 ? "+" : ""}${allocBps} bps, while security selection delivered ${selectBps >= 0 ? "+" : ""}${selectBps} bps.`;
  } else {
    explanation = `Portfolio trailed ${benchmark.name} by ${(Math.abs(rawActiveReturn) * 100).toFixed(2)}% (${diffBps} bps). Allocation drag contributed ${allocBps} bps, while asset selection drove ${selectBps} bps.`;
  }

  return {
    portfolioId,
    benchmarkSymbol: benchmark.symbol,
    benchmarkName: benchmark.name,
    portfolioReturn: parseFloat(portfolioTotalReturn.toFixed(4)),
    benchmarkReturn: parseFloat(benchmarkTotalReturn.toFixed(4)),
    totalActiveReturn: parseFloat(rawActiveReturn.toFixed(4)),
    portfolioCurrency: portCurrency,
    benchmarkCurrency: benchCurrency,
    fxTreatment: portCurrency === benchCurrency ? "LOCAL_CURRENCY" : "UNHEDGED_BASE",
    returnType: benchmark.returnType || "TOTAL_RETURN",
    isSimulated: benchmark.isSimulated ?? false,
    summary: {
      allocationEffect: parseFloat(totalAllocEffect.toFixed(4)),
      selectionEffect: parseFloat(totalSelectEffect.toFixed(4)),
      interactionEffect: parseFloat(totalInteractEffect.toFixed(4)),
    },
    breakdown,
    narrativeExplanation: explanation,
    quality,
    methodologyVersion: ATTRIBUTION_METHODOLOGY_VERSION,
    isReconciled,
    warnings,
  };
}
