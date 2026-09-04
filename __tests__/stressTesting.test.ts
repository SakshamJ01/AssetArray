import { runStressTest, CRISIS_SCENARIOS } from "../src/services/stressTesting";
import { SimpleHolding } from "../src/services/rebalancer";

describe("Macro Stress-Testing Crisis Simulation Engine", () => {
  const mockHoldings: SimpleHolding[] = [
    {
      id: "h1",
      assetName: "Nifty 50 Bluechip",
      assetClass: "Equity",
      investedValue: 1000000,
      currentValue: 1200000,
    },
    {
      id: "h2",
      assetName: "Sovereign 10Y G-Sec",
      assetClass: "Debt",
      investedValue: 500000,
      currentValue: 500000,
    },
    {
      id: "h3",
      assetName: "Physical Gold Bullion",
      assetClass: "Alternative",
      investedValue: 300000,
      currentValue: 300000,
    },
  ];

  it("accurately models 2008 GFC shock and flight to quality", () => {
    const gfcScenario = CRISIS_SCENARIOS.find((s) => s.id === "gfc_2008")!;
    const result = runStressTest(mockHoldings, gfcScenario);

    // Initial total: 1200k + 500k + 300k = 2,000,000
    expect(result.initialTotalAum).toBe(2000000);

    // Equity: 1,200k * (1 - 0.42) = 696,000
    // Debt: 500k * (1 + 0.12) = 560,000
    // Alt: 300k * (1 + 0.18) = 354,000
    // Projected Total: 696k + 560k + 354k = 1,610,000
    expect(result.projectedTotalAum).toBe(1610000);
    expect(result.totalDrawdownDollars).toBe(390000);
    expect(result.totalDrawdownPercentage).toBe(19.5);
    expect(result.resilienceRating).toBe("AA Resilient");
    expect(result.projectedRecoveryMonths).toBeGreaterThan(15);
  });

  it("handles stagflation scenario with commodity protection", () => {
    const stagflation = CRISIS_SCENARIOS.find((s) => s.id === "stagflation_1970s")!;
    const result = runStressTest(mockHoldings, stagflation);

    // Alternative asset class gains +32%
    const altItem = result.breakdown.find((b) => b.assetClass === "Alternative");
    expect(altItem?.dollarChange).toBe(96000); // 300k * 0.32
    expect(result.totalDrawdownDollars).toBeGreaterThan(0);
  });

  it("handles empty portfolio safely", () => {
    const result = runStressTest([]);
    expect(result.initialTotalAum).toBe(0);
    expect(result.projectedTotalAum).toBe(0);
    expect(result.totalDrawdownDollars).toBe(0);
    expect(result.breakdown.length).toBe(0);
  });
});
