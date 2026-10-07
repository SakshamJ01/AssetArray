import { ConstitutionService } from "../src/services/intelligence/constitutionService";
import { PortfolioHolding } from "../src/types/wealth";

describe("Anti-Impulse Investment Constitution Service", () => {
  const mockHoldings: PortfolioHolding[] = [
    {
      id: "h_stock_huge",
      assetName: "Tata Motors Ltd.",
      assetClass: "Stocks",
      ticker: "TATAMOTORS",
      quantity: "500",
      investedValue: "300000",
      currentValue: "400000",
      targetWeight: "80",
      notes: "",
    },
    {
      id: "h_cash",
      assetName: "Savings Account",
      assetClass: "Cash",
      ticker: "CASH_SAVINGS",
      quantity: "1",
      investedValue: "10000",
      currentValue: "10000",
      targetWeight: "20",
      notes: "",
    },
  ];

  test("evaluates investment policy rules and flags concentration violations", () => {
    const res = ConstitutionService.evaluateRules(mockHoldings);

    expect(res.rules.length).toBe(3);
    // Single stock is 400k out of 410k (~97.5%), so it should violate the 15% cap
    const singleStockRule = res.rules.find((r) => r.id === "rule_max_stock");
    expect(singleStockRule?.isCompliant).toBe(false);
    expect(res.hasViolations).toBe(true);
    expect(res.overallComplianceScore).toBeLessThan(100);
  });

  test("simulates historical crash impacts with drawdown warnings", () => {
    const crashSims = ConstitutionService.simulateCrashScenarios(1000000, 70);

    expect(crashSims.length).toBe(3);
    expect(crashSims[0].scenarioName).toContain("2008");
    expect(crashSims[0].estimatedLoss).toBeGreaterThan(0);
    expect(crashSims[0].portfolioValueAfterCrash).toBeLessThan(1000000);
    expect(crashSims[0].warningAlert.length).toBeGreaterThan(10);
  });
});
