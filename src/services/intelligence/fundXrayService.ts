import { PortfolioHolding } from "../../types/wealth";
import {
  ConstituentStock,
  FundXrayResult,
  OverlapItem,
  OverlapAnalysisResult,
} from "../../types/intelligence";

// Comprehensive ground-truth constituent mappings for common benchmark indices & mutual funds
const BENCHMARK_CONSTITUENTS_MAP: Record<string, ConstituentStock[]> = {
  nifty50: [
    { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", weight: 11.8, sector: "Financials" },
    { ticker: "RELIANCE", name: "Reliance Industries Ltd.", weight: 9.4, sector: "Energy" },
    { ticker: "ICICIBANK", name: "ICICI Bank Ltd.", weight: 8.1, sector: "Financials" },
    { ticker: "INFY", name: "Infosys Ltd.", weight: 6.2, sector: "Technology" },
    { ticker: "ITC", name: "ITC Ltd.", weight: 4.5, sector: "Consumer Goods" },
    { ticker: "TCS", name: "Tata Consultancy Services Ltd.", weight: 4.1, sector: "Technology" },
    { ticker: "LT", name: "Larsen & Toubro Ltd.", weight: 3.9, sector: "Industrials" },
    { ticker: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd.", weight: 3.2, sector: "Financials" },
    { ticker: "AXISBANK", name: "Axis Bank Ltd.", weight: 3.0, sector: "Financials" },
    { ticker: "SBIN", name: "State Bank of India", weight: 2.8, sector: "Financials" },
  ],
  flexicap: [
    { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", weight: 8.5, sector: "Financials" },
    { ticker: "ICICIBANK", name: "ICICI Bank Ltd.", weight: 7.2, sector: "Financials" },
    { ticker: "INFY", name: "Infosys Ltd.", weight: 5.9, sector: "Technology" },
    { ticker: "TCS", name: "Tata Consultancy Services Ltd.", weight: 4.8, sector: "Technology" },
    { ticker: "BAJFINANCE", name: "Bajaj Finance Ltd.", weight: 4.2, sector: "Financials" },
    { ticker: "RELIANCE", name: "Reliance Industries Ltd.", weight: 3.9, sector: "Energy" },
    { ticker: "BHARTIARTL", name: "Bharti Airtel Ltd.", weight: 3.5, sector: "Telecom" },
    { ticker: "TITAN", name: "Titan Company Ltd.", weight: 3.1, sector: "Consumer Goods" },
  ],
  tech: [
    { ticker: "INFY", name: "Infosys Ltd.", weight: 26.5, sector: "Technology" },
    { ticker: "TCS", name: "Tata Consultancy Services Ltd.", weight: 24.0, sector: "Technology" },
    { ticker: "HCLTECH", name: "HCL Technologies Ltd.", weight: 12.5, sector: "Technology" },
    { ticker: "WIPRO", name: "Wipro Ltd.", weight: 8.0, sector: "Technology" },
    { ticker: "TECHM", name: "Tech Mahindra Ltd.", weight: 6.5, sector: "Technology" },
  ],
};

export class FundXrayService {
  /**
   * Deconstructs a mutual fund or ETF holding into its underlying equity constituents.
   */
  static deconstructHolding(holding: PortfolioHolding): FundXrayResult {
    const nameLower = (holding.assetName + " " + (holding.ticker || "")).toLowerCase();

    let topConstituents = BENCHMARK_CONSTITUENTS_MAP.nifty50;
    let expenseRatio = 0.85; // %

    if (nameLower.includes("tech") || nameLower.includes("it")) {
      topConstituents = BENCHMARK_CONSTITUENTS_MAP.tech;
      expenseRatio = 1.15;
    } else if (
      nameLower.includes("flexi") ||
      nameLower.includes("focused") ||
      nameLower.includes("multi")
    ) {
      topConstituents = BENCHMARK_CONSTITUENTS_MAP.flexicap;
      expenseRatio = 1.45;
    } else if (nameLower.includes("etf") || nameLower.includes("index")) {
      topConstituents = BENCHMARK_CONSTITUENTS_MAP.nifty50;
      expenseRatio = 0.25;
    }

    return {
      fundName: holding.assetName,
      isinOrTicker: holding.ticker || holding.id,
      expenseRatio,
      topConstituents,
    };
  }

  /**
   * Performs deep portfolio look-through and overlap matrix analysis across all funds.
   */
  static analyzePortfolioOverlap(holdings: PortfolioHolding[]): OverlapAnalysisResult {
    const fundHoldings = holdings.filter(
      (h) => h.assetClass === "Mutual Funds" || h.assetClass === "Stocks"
    );

    if (fundHoldings.length === 0) {
      return {
        totalAnalyzedValue: 0,
        averageExpenseRatio: 0,
        estimatedAnnualFeeDrag: 0,
        overlapScore: 0,
        topOverlappingStocks: [],
        highConcentrationWarning: false,
        consolidationRecommendations: ["Add equity or mutual fund holdings to run look-through X-Ray."],
      };
    }

    const totalAnalyzedValue = fundHoldings.reduce(
      (sum, h) => sum + (parseFloat(h.currentValue) || 0),
      0
    );

    const stockMap: Record<
      string,
      {
        name: string;
        sector: string;
        funds: { fundName: string; weightInFund: number; valueInFund: number }[];
        totalValue: number;
      }
    > = {};

    let totalExpenseTimesValue = 0;

    for (const holding of fundHoldings) {
      const fundVal = parseFloat(holding.currentValue) || 0;
      const xray = this.deconstructHolding(holding);
      totalExpenseTimesValue += (xray.expenseRatio / 100) * fundVal;

      for (const constituent of xray.topConstituents) {
        const constituentValue = (constituent.weight / 100) * fundVal;
        if (!stockMap[constituent.ticker]) {
          stockMap[constituent.ticker] = {
            name: constituent.name,
            sector: constituent.sector,
            funds: [],
            totalValue: 0,
          };
        }
        stockMap[constituent.ticker].funds.push({
          fundName: holding.assetName,
          weightInFund: constituent.weight,
          valueInFund: constituentValue,
        });
        stockMap[constituent.ticker].totalValue += constituentValue;
      }
    }

    const topOverlappingStocks: OverlapItem[] = Object.keys(stockMap)
      .map((ticker) => {
        const item = stockMap[ticker];
        const totalConsolidatedWeight =
          totalAnalyzedValue > 0
            ? Math.round((item.totalValue / totalAnalyzedValue) * 1000) / 10
            : 0;
        return {
          stockTicker: ticker,
          stockName: item.name,
          sector: item.sector,
          fundsContaining: item.funds,
          totalConsolidatedWeight,
          totalConsolidatedValue: Math.round(item.totalValue),
        };
      })
      .sort((a, b) => b.totalConsolidatedValue - a.totalConsolidatedValue);

    const averageExpenseRatio =
      totalAnalyzedValue > 0
        ? Math.round((totalExpenseTimesValue / totalAnalyzedValue) * 10000) / 100
        : 0;

    // Estimate potential fee drag compared to low-cost index alternative (0.20%)
    const lowCostBenchmarkExpense = 0.2; // 0.20%
    const estimatedAnnualFeeDrag = Math.max(
      0,
      Math.round(totalAnalyzedValue * ((averageExpenseRatio - lowCostBenchmarkExpense) / 100))
    );

    // Overlap score: how many stocks appear in > 1 fund
    const duplicateStockCount = topOverlappingStocks.filter(
      (s) => s.fundsContaining.length > 1
    ).length;
    const overlapScore = Math.min(100, Math.round((duplicateStockCount / Math.max(1, topOverlappingStocks.length)) * 100));

    const highConcentrationWarning = topOverlappingStocks.some(
      (s) => s.totalConsolidatedWeight > 15
    );

    const recommendations: string[] = [];
    if (overlapScore > 50) {
      recommendations.push(
        `High Stock Overlap (${overlapScore}%): Consider consolidating 2+ overlapping active mutual funds into 1 low-cost broad index ETF.`
      );
    }
    if (estimatedAnnualFeeDrag > 5000) {
      recommendations.push(
        `Switching redundant active funds to Direct/Index equivalents could save approx. ₹${estimatedAnnualFeeDrag.toLocaleString("en-IN")} annually in fee drag.`
      );
    }
    if (highConcentrationWarning) {
      const topStock = topOverlappingStocks[0];
      recommendations.push(
        `Single-stock concentration risk detected: Consolidated exposure to ${topStock.stockName} is ${topStock.totalConsolidatedWeight}% of equity assets.`
      );
    }
    if (recommendations.length === 0) {
      recommendations.push("Portfolio exhibits healthy stock diversification with minimal duplicate fee drag.");
    }

    return {
      totalAnalyzedValue,
      averageExpenseRatio,
      estimatedAnnualFeeDrag,
      overlapScore,
      topOverlappingStocks,
      highConcentrationWarning,
      consolidationRecommendations: recommendations,
    };
  }
}
