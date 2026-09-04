import { ClientInput } from "../src/services/aiAdvisor";

describe("PDF Report Data Formatter", () => {
  const sampleClient: ClientInput = {
    id: "test-client-1",
    name: "Alexander Hamilton",
    category: "HNI",
    priority: "High",
    portfolio: [
      {
        assetName: "Vanguard S&P 500 ETF",
        assetClass: "Stocks",
        ticker: "VOO",
        quantity: "150",
        investedValue: "60000",
        currentValue: "78000",
      },
      {
        assetName: "Treasury Bond Fund",
        assetClass: "Bonds",
        ticker: "BND",
        quantity: "500",
        investedValue: "40000",
        currentValue: "42000",
      },
    ],
  };

  it("calculates accurate total portfolio values and returns", () => {
    const holdings = sampleClient.portfolio || [];
    const totalValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);
    const totalGainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(1) : "0";

    expect(totalValue).toBe(120000);
    expect(totalCost).toBe(100000);
    expect(totalGainLoss).toBe(20000);
    expect(gainLossPercent).toBe("20.0");
  });

  it("handles empty portfolios gracefully without NaN", () => {
    const emptyClient: ClientInput = {
      id: "test-empty",
      name: "New Client",
      category: "Retail",
      priority: "Low",
      portfolio: [],
    };

    const holdings = emptyClient.portfolio || [];
    const totalValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);
    const totalGainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(1) : "0";

    expect(totalValue).toBe(0);
    expect(totalCost).toBe(0);
    expect(totalGainLoss).toBe(0);
    expect(gainLossPercent).toBe("0");
    expect(Number.isNaN(Number(gainLossPercent))).toBe(false);
  });
});
