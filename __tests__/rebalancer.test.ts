import { calculateRebalance, TARGET_MODELS, SimpleHolding } from "../src/services/rebalancer";

describe("Portfolio Rebalancer & Tax Loss Harvesting Engine", () => {
  const mockHoldings: SimpleHolding[] = [
    {
      id: "h1",
      assetName: "HDFC Nifty 50 ETF",
      assetClass: "Equity",
      investedValue: 600000,
      currentValue: 800000,
    },
    {
      id: "h2",
      assetName: "Tech Growth Fund",
      assetClass: "Equity",
      investedValue: 400000,
      currentValue: 300000, // 100k unrealized loss
    },
    {
      id: "h3",
      assetName: "Government Sovereign Bonds",
      assetClass: "Debt",
      investedValue: 300000,
      currentValue: 350000,
    },
    {
      id: "h4",
      assetName: "Physical Gold Sovereign",
      assetClass: "Alternative",
      investedValue: 200000,
      currentValue: 250000,
    },
  ];

  it("calculates total portfolio value accurately", () => {
    const result = calculateRebalance(mockHoldings, TARGET_MODELS[1]);
    // 800k + 300k + 350k + 250k = 1,700,000
    expect(result.totalPortfolioValue).toBe(1700000);
  });

  it("identifies allocation drift against balanced model", () => {
    // Model 1 is Balanced Fiduciary: Equity 50%, Debt 30%, Alt 20%
    // Current: Equity = 1,100k (64.7%), Debt = 350k (20.6%), Alt = 250k (14.7%)
    const result = calculateRebalance(mockHoldings, TARGET_MODELS[1]);

    expect(result.isRebalanceRecommended).toBe(true);
    expect(result.maxDrift).toBeGreaterThan(10); // Equity is overweight by ~14.7%

    const equityItem = result.items.find((i) => i.assetClass === "Equity");
    expect(equityItem?.action).toBe("SELL");

    const debtItem = result.items.find((i) => i.assetClass === "Debt");
    expect(debtItem?.action).toBe("BUY");
  });

  it("identifies tax-loss harvesting candidates and computes tax shield", () => {
    const result = calculateRebalance(mockHoldings);

    expect(result.taxLossCandidates.length).toBe(1);
    expect(result.taxLossCandidates[0].assetName).toBe("Tech Growth Fund");
    expect(result.taxLossCandidates[0].unrealizedLoss).toBe(100000);
    expect(result.potentialTaxShield).toBe(20000); // 20% of 100,000
  });

  it("handles empty portfolios gracefully without errors", () => {
    const result = calculateRebalance([]);
    expect(result.totalPortfolioValue).toBe(0);
    expect(result.items.length).toBe(0);
    expect(result.isRebalanceRecommended).toBe(false);
  });
});
