import {
  clonePortfolioToScenario,
  applyScenarioChanges,
  compareScenarioSideBySide,
} from "../src/services/scenarioEngine";
import { PortfolioHolding, WhatIfScenario } from "../src/types/wealth";

describe("What-If Portfolio Sandbox Engine", () => {
  const baseHoldings: PortfolioHolding[] = [
    {
      id: "h1",
      assetName: "Infosys Ltd",
      assetClass: "Stocks",
      ticker: "INFY.NS",
      quantity: "100",
      investedValue: "140000",
      currentValue: "160000",
      targetWeight: "50",
      notes: "",
    },
    {
      id: "h2",
      assetName: "Govt Gilt 2033",
      assetClass: "Bonds",
      ticker: "GILT2033",
      quantity: "200",
      investedValue: "200000",
      currentValue: "200000",
      targetWeight: "50",
      notes: "",
    },
  ];

  it("guarantees absolute immutability of base portfolio holdings", () => {
    const originalJson = JSON.stringify(baseHoldings);
    const scenario: WhatIfScenario = {
      id: "scn_1",
      basePortfolioId: "port_1",
      name: "Severe Tech Crash",
      createdAt: new Date().toISOString(),
      changes: [
        {
          type: "SELL",
          targetHoldingId: "h1",
          deltaPercent: 0.50, // Sell 50% of Infy
        },
        {
          type: "CASH_INFLOW",
          deltaAmount: 80000,
        },
      ],
      assumptions: {
        equityShockPct: -30,
      },
    };

    const scenarioHoldings = applyScenarioChanges(baseHoldings, scenario);

    // Ensure scenario holdings were modified
    expect(scenarioHoldings.length).toBeGreaterThanOrEqual(2);
    expect(Number(scenarioHoldings[0].currentValue)).toBeLessThan(160000);

    // CRITICAL: Ensure base holdings were NOT mutated!
    expect(JSON.stringify(baseHoldings)).toBe(originalJson);
    expect(baseHoldings[0].currentValue).toBe("160000");
  });

  it("produces comprehensive side-by-side comparison metrics", () => {
    const scenario = clonePortfolioToScenario(baseHoldings, "port_1", "Defensive Shift");
    scenario.changes = [
      {
        type: "CASH_INFLOW",
        deltaAmount: 50000,
      },
    ];

    const scenarioHoldings = applyScenarioChanges(baseHoldings, scenario);
    const comparison = compareScenarioSideBySide(baseHoldings, scenarioHoldings, scenario.name, "port_1");

    expect(comparison.metrics.totalValue.scenario).toBeGreaterThan(comparison.metrics.totalValue.current);
    expect(comparison.metrics.healthScore).toBeDefined();
    expect(comparison.metrics.sharpeRatio).toBeDefined();
    expect(typeof comparison.metrics.estimatedTaxImpact).toBe("number");
    expect(typeof comparison.narrativeSummary).toBe("string");
  });
});
