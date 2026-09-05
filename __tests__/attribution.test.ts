import {
  calculateAttribution,
  STANDARD_BENCHMARKS,
  normalizeCategory,
} from "../src/services/attribution";
import { PortfolioHolding } from "../src/types/wealth";

describe("Brinson-Fachler Performance Attribution Engine", () => {
  const mockHoldings: PortfolioHolding[] = [
    {
      id: "h1",
      assetName: "Infosys Ltd",
      assetClass: "Stocks",
      ticker: "INFY",
      quantity: "500",
      investedValue: "600000",
      currentValue: "750000", // +25% return
      targetWeight: "50",
      notes: "Core IT Holding",
    },
    {
      id: "h2",
      assetName: "HDFC Bank",
      assetClass: "Stocks",
      ticker: "HDFCBANK",
      quantity: "400",
      investedValue: "600000",
      currentValue: "660000", // +10% return
      targetWeight: "30",
      notes: "Banking leader",
    },
    {
      id: "h3",
      assetName: "Bharat Bond ETF",
      assetClass: "Bonds",
      ticker: "BHARATBOND",
      quantity: "1000",
      investedValue: "300000",
      currentValue: "321000", // +7% return
      targetWeight: "20",
      notes: "Fixed income core",
    },
  ];

  it("normalizes asset classes into standard categories", () => {
    expect(normalizeCategory("Equity")).toBe("Stocks");
    expect(normalizeCategory("Stocks")).toBe("Stocks");
    expect(normalizeCategory("Debt")).toBe("Bonds");
    expect(normalizeCategory("Fixed Income")).toBe("Bonds");
    expect(normalizeCategory("Liquid Mutual Fund")).toBe("Mutual Funds");
    expect(normalizeCategory("Cash Equivalent")).toBe("Cash");
    expect(normalizeCategory("Gold ETF")).toBe("Alternatives");
  });

  it("calculates active return, allocation, selection, and interaction effects", () => {
    const result = calculateAttribution(
      mockHoldings,
      STANDARD_BENCHMARKS.BALANCED_HYBRID,
      "port-1"
    );

    expect(result.portfolioId).toBe("port-1");
    expect(result.benchmarkSymbol).toBe("BALANCED_65_35");
    expect(result.breakdown.length).toBeGreaterThan(0);

    // Mathematical identity check:
    // Total Active Return must equal Sum(Allocation + Selection + Interaction)
    const sumActive =
      result.summary.allocationEffect +
      result.summary.selectionEffect +
      result.summary.interactionEffect;

    expect(Math.abs(result.totalActiveReturn - sumActive)).toBeLessThan(0.001);
  });

  it("generates a plain-language explanation for outperformance or drag", () => {
    const result = calculateAttribution(
      mockHoldings,
      STANDARD_BENCHMARKS.BALANCED_HYBRID,
      "port-1"
    );

    expect(typeof result.narrativeExplanation).toBe("string");
    expect(result.narrativeExplanation.length).toBeGreaterThan(20);
    expect(result.narrativeExplanation).toContain("CRISIL Hybrid 65:35 Aggressive");
  });

  it("handles empty holdings without crashing", () => {
    const result = calculateAttribution([], STANDARD_BENCHMARKS.NIFTY_50, "empty-port");
    expect(result.portfolioReturn).toBe(0);
    expect(result.breakdown.length).toBeGreaterThan(0);
    expect(result.totalActiveReturn).toBeLessThanOrEqual(0);
  });
});
