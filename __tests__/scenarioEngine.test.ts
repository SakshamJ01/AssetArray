import {
  simulateScenario,
  PRESET_SCENARIOS,
} from "../src/services/scenarioEngine";
import { PortfolioHolding } from "../src/types/wealth";

describe("What-If Scenario Sandbox Engine", () => {
  const mockEquityHeavyHoldings: PortfolioHolding[] = [
    {
      id: "h1",
      assetName: "Nifty 50 Index Fund",
      assetClass: "Stocks",
      ticker: "NIFTY50",
      quantity: "1000",
      investedValue: "800000",
      currentValue: "1000000", // 10 Lakhs in equity
      targetWeight: "100",
      notes: "Pure equity portfolio",
    },
  ];

  it("accurately projects a 22% tech correction shock on equity holdings", () => {
    const result = simulateScenario(
      mockEquityHeavyHoldings,
      PRESET_SCENARIOS.TECH_CORRECTION,
      "port-tech"
    );

    expect(result.initialValue).toBe(1000000);
    expect(result.projectedValue).toBe(780000); // 1,000,000 * (1 - 0.22) = 780,000
    expect(result.percentChange).toBe(-22);
    expect(result.valueDistribution.length).toBe(5);

    // Distribution percentiles monotonic check: P5 <= P25 <= P50 <= P75 <= P95
    const dist = result.valueDistribution;
    expect(dist[0].percentile).toBe(5);
    expect(dist[0].value).toBeLessThan(dist[2].value); // P5 < P50
    expect(dist[2].value).toBeLessThan(dist[4].value); // P50 < P95
  });

  it("adjusts goal success probability and provides plain-language advisory", () => {
    const result = simulateScenario(
      mockEquityHeavyHoldings,
      PRESET_SCENARIOS.GLOBAL_FINANCIAL_CRISIS,
      "port-gfc"
    );

    expect(result.percentChange).toBeLessThan(-30);
    expect(result.goalSuccessProbability).toBeLessThan(70);
    expect(result.advisoryCommentary).toContain("Severe stress test impact");
  });

  it("handles empty holdings safely", () => {
    const result = simulateScenario([], PRESET_SCENARIOS.EM_BULL_CYCLE, "port-0");
    expect(result.initialValue).toBe(0);
    expect(result.projectedValue).toBe(0);
    expect(result.valueDistribution.length).toBe(0);
  });
});
