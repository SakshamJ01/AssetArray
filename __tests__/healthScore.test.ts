import { calculateHealthScore } from "../src/services/healthScore";
import { PortfolioHolding } from "../src/types/wealth";

describe("AI Portfolio Health Score Diagnostic Engine", () => {
  const mockBalancedHoldings: PortfolioHolding[] = [
    {
      id: "h1",
      assetName: "HDFC Nifty 50 ETF",
      assetClass: "Stocks",
      ticker: "HDFCNIFTY",
      quantity: "500",
      investedValue: "400000",
      currentValue: "500000",
      targetWeight: "35",
      notes: "Core Large Cap",
    },
    {
      id: "h2",
      assetName: "Sovereign Gold Bonds 2031",
      assetClass: "Alternatives",
      ticker: "SGB2031",
      quantity: "50",
      investedValue: "250000",
      currentValue: "300000",
      targetWeight: "20",
      notes: "Inflation hedge",
    },
    {
      id: "h3",
      assetName: "Bharat Bond ETF 2030",
      assetClass: "Bonds",
      ticker: "BHARATBOND",
      quantity: "300",
      investedValue: "300000",
      currentValue: "350000",
      targetWeight: "25",
      notes: "AAA Yield",
    },
    {
      id: "h4",
      assetName: "Treasury Liquid Cash",
      assetClass: "Cash",
      ticker: "LIQUID",
      quantity: "1",
      investedValue: "150000",
      currentValue: "150000",
      targetWeight: "10",
      notes: "Rebalance reserve",
    },
  ];

  const mockConcentratedHoldings: PortfolioHolding[] = [
    {
      id: "h1",
      assetName: "High Beta Speculative Tech",
      assetClass: "Stocks",
      ticker: "TECHSPEC",
      quantity: "1000",
      investedValue: "1000000",
      currentValue: "950000", // 95% of portfolio in 1 asset!
      targetWeight: "100",
      notes: "Ultra concentration",
    },
    {
      id: "h2",
      assetName: "Dust Cash",
      assetClass: "Cash",
      ticker: "CASH",
      quantity: "1",
      investedValue: "50000",
      currentValue: "50000",
      targetWeight: "5",
      notes: "Minimal",
    },
  ];

  it("assigns high institutional score to well-diversified portfolios", () => {
    const result = calculateHealthScore(mockBalancedHoldings, 50000, "port-bal");

    expect(result.healthScore).toBeGreaterThanOrEqual(75);
    expect(["Institutional", "Balanced"]).toContain(result.grade);
    expect(result.factors.dataCompleteness).toBe(100);
    expect(result.factors.assetDiversification).toBeGreaterThan(60);
    expect(result.factors.concentrationRisk).toBeGreaterThanOrEqual(70);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("penalizes extreme single-asset concentration", () => {
    const result = calculateHealthScore(mockConcentratedHoldings, 0, "port-conc");

    expect(result.factors.concentrationRisk).toBeLessThanOrEqual(40);
    expect(result.healthScore).toBeLessThan(70);
    expect(
      result.recommendations.some((r) => r.includes("concentration") || r.includes("Trim"))
    ).toBe(true);
  });

  it("gracefully handles empty portfolio with fallback score and guidance", () => {
    const result = calculateHealthScore([], 0, "port-empty");
    expect(result.healthScore).toBe(30);
    expect(result.grade).toBe("High Fragility");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
