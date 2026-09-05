import { BenchmarkModel } from "../../types/wealth";

export const BENCHMARK_REGISTRY: Record<string, BenchmarkModel> = {
  NIFTY_50: {
    id: "bench_nifty50",
    symbol: "NIFTY50",
    name: "Nifty 50 Total Return Index",
    currency: "INR",
    region: "India",
    assetClass: "Equity Large Cap",
    methodology: "Free-float market capitalization weighted index of top 50 Indian companies.",
    dataSource: "HISTORICAL",
    totalReturnAvailable: true,
    priceReturnAvailable: true,
    categoryReturns: {
      Stocks: 0.124,
      Cash: 0.065,
      Bonds: 0.072,
      Alternatives: 0.11,
      "Mutual Funds": 0.118,
    },
  },
  NIFTY_500: {
    id: "bench_nifty500",
    symbol: "NIFTY500",
    name: "Nifty 500 Broad Market Index",
    currency: "INR",
    region: "India",
    assetClass: "Equity Broad Market",
    methodology: "Broad-based Indian market representation covering 500 companies across large, mid, and small cap.",
    dataSource: "HISTORICAL",
    totalReturnAvailable: true,
    priceReturnAvailable: true,
    categoryReturns: {
      Stocks: 0.138,
      Cash: 0.065,
      Bonds: 0.072,
      Alternatives: 0.11,
      "Mutual Funds": 0.125,
    },
  },
  BSE_SENSEX: {
    id: "bench_sensex",
    symbol: "SENSEX",
    name: "S&P BSE Sensex Total Return Index",
    currency: "INR",
    region: "India",
    assetClass: "Equity Large Cap",
    methodology: "30 financially sound, actively traded bellwether companies listed on BSE.",
    dataSource: "HISTORICAL",
    totalReturnAvailable: true,
    priceReturnAvailable: true,
    categoryReturns: {
      Stocks: 0.121,
      Cash: 0.065,
      Bonds: 0.072,
      Alternatives: 0.11,
      "Mutual Funds": 0.116,
    },
  },
  SP_500: {
    id: "bench_sp500",
    symbol: "SPX",
    name: "S&P 500 Total Return Index",
    currency: "USD",
    region: "United States",
    assetClass: "Equity Large Cap",
    methodology: "Market-capitalization-weighted index of 500 leading publicly traded companies in the US.",
    dataSource: "HISTORICAL",
    totalReturnAvailable: true,
    priceReturnAvailable: true,
    categoryReturns: {
      Stocks: 0.135,
      Cash: 0.048,
      Bonds: 0.042,
      Alternatives: 0.09,
      "Mutual Funds": 0.128,
    },
  },
  NASDAQ_COMPOSITE: {
    id: "bench_nasdaq",
    symbol: "COMP",
    name: "NASDAQ Composite Index",
    currency: "USD",
    region: "United States",
    assetClass: "Equity Growth & Tech",
    methodology: "Market capitalization-weighted index of more than 3,700 stocks listed on the Nasdaq.",
    dataSource: "HISTORICAL",
    totalReturnAvailable: true,
    priceReturnAvailable: true,
    categoryReturns: {
      Stocks: 0.165,
      Cash: 0.048,
      Bonds: 0.042,
      Alternatives: 0.09,
      "Mutual Funds": 0.145,
    },
  },
  CRISIL_HYBRID_65_35: {
    id: "bench_crisil_hybrid",
    symbol: "CRISIL_65_35",
    name: "CRISIL Hybrid 65:35 Aggressive Index",
    currency: "INR",
    region: "India",
    assetClass: "Multi Asset Hybrid",
    methodology: "Blended benchmark of 65% S&P BSE 200 and 35% CRISIL Composite Bond Fund Index.",
    dataSource: "HISTORICAL",
    totalReturnAvailable: true,
    priceReturnAvailable: true,
    categoryReturns: {
      Stocks: 0.124,
      Bonds: 0.074,
      Cash: 0.065,
      Alternatives: 0.11,
      "Mutual Funds": 0.112,
    },
  },
};

/**
 * Retrieves a benchmark by symbol or ID with safe fallback to NIFTY 50
 */
export function getBenchmarkBySymbol(symbol: string): BenchmarkModel {
  const norm = (symbol || "").toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const found = Object.values(BENCHMARK_REGISTRY).find(
    (b) => b.symbol.toUpperCase() === norm || b.id.toUpperCase() === norm
  );
  return found || BENCHMARK_REGISTRY.NIFTY_50;
}

/**
 * Creates a custom benchmark specification
 */
export function createCustomBenchmark(params: {
  id: string;
  name: string;
  symbol: string;
  currency?: string;
  region?: string;
  assetClass?: string;
  categoryReturns: Record<string, number>;
}): BenchmarkModel {
  return {
    id: params.id,
    symbol: params.symbol,
    name: params.name,
    currency: params.currency || "INR",
    region: params.region || "Global",
    assetClass: params.assetClass || "Custom Multi-Asset",
    methodology: "Advisor-configured custom benchmark allocation.",
    dataSource: "USER_INPUT",
    totalReturnAvailable: true,
    priceReturnAvailable: false,
    categoryReturns: params.categoryReturns,
  };
}
