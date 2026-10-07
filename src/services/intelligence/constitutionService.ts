import { PortfolioHolding } from "../../types/wealth";
import { ConstitutionRule, CrashSimulationImpact } from "../../types/intelligence";

export class ConstitutionService {
  /**
   * Generates default Investment Policy Statement rules and checks compliance.
   */
  static evaluateRules(
    holdings: PortfolioHolding[],
    customRules?: ConstitutionRule[]
  ): {
    rules: ConstitutionRule[];
    overallComplianceScore: number;
    hasViolations: boolean;
  } {
    const totalPortfolioValue = holdings.reduce(
      (sum, h) => sum + (parseFloat(h.currentValue) || 0),
      0
    );

    // Compute metrics
    let maxSingleStockWeight = 0;
    let equityWeight = 0;
    let debtWeight = 0;
    let cashWeight = 0;

    for (const h of holdings) {
      const val = parseFloat(h.currentValue) || 0;
      const weight = totalPortfolioValue > 0 ? (val / totalPortfolioValue) * 100 : 0;

      if (h.assetClass === "Stocks" && weight > maxSingleStockWeight) {
        maxSingleStockWeight = weight;
      }
      if (h.assetClass === "Stocks" || h.assetClass === "Mutual Funds") {
        equityWeight += weight;
      } else if (h.assetClass === "Bonds") {
        debtWeight += weight;
      } else if (h.assetClass === "Cash") {
        cashWeight += weight;
      }
    }

    const defaultRules: ConstitutionRule[] = [
      {
        id: "rule_max_stock",
        name: "Max Single-Stock Cap",
        description: "No single direct equity holding shall exceed 15% of total portfolio value.",
        category: "Concentration",
        threshold: 15,
        thresholdUnit: "%",
        currentValue: Math.round(maxSingleStockWeight * 10) / 10,
        isCompliant: maxSingleStockWeight <= 15,
        violationMessage:
          maxSingleStockWeight > 15
            ? `Top single stock exceeds limit at ${maxSingleStockWeight.toFixed(1)}% (Cap: 15%).`
            : undefined,
      },
      {
        id: "rule_min_liquidity",
        name: "Emergency Cash & Liquid Reserve",
        description: "Maintain minimum 5% in liquid Cash / Overnight instruments.",
        category: "Liquidity",
        threshold: 5,
        thresholdUnit: "%",
        currentValue: Math.round(cashWeight * 10) / 10,
        isCompliant: cashWeight >= 5,
        violationMessage:
          cashWeight < 5
            ? `Liquid cash buffer is below mandate at ${cashWeight.toFixed(1)}% (Target: ≥5%).`
            : undefined,
      },
      {
        id: "rule_max_equity_drift",
        name: "Max Equity Allocation Ceiling",
        description: "Total risk-asset equity exposure shall not exceed 80% without written mandate revision.",
        category: "AssetAllocation",
        threshold: 80,
        thresholdUnit: "%",
        currentValue: Math.round(equityWeight * 10) / 10,
        isCompliant: equityWeight <= 80,
        violationMessage:
          equityWeight > 80
            ? `Equity exposure exceeds ceiling at ${equityWeight.toFixed(1)}% (Ceiling: 80%).`
            : undefined,
      },
    ];

    const rules = customRules || defaultRules;
    const compliantCount = rules.filter((r) => r.isCompliant).length;
    const overallComplianceScore = Math.round((compliantCount / Math.max(1, rules.length)) * 100);

    return {
      rules,
      overallComplianceScore,
      hasViolations: compliantCount < rules.length,
    };
  }

  /**
   * Simulates real historical market crashes to enforce behavioral discipline.
   */
  static simulateCrashScenarios(
    portfolioValue: number,
    equityAllocationPct: number = 70
  ): CrashSimulationImpact[] {
    const equityVal = (equityAllocationPct / 100) * portfolioValue;
    const debtVal = portfolioValue - equityVal;

    const scenarios = [
      {
        name: "2008 Global Financial Crisis (GFC)",
        marketDropPct: 52.0,
        maxDrawdownDurationMonths: 24,
        warningAlert: "Equities plunged 52% over 18 months; recovery required 2.5 years of strict holding discipline.",
      },
      {
        name: "2020 COVID-19 Flash Crash",
        marketDropPct: 38.0,
        maxDrawdownDurationMonths: 7,
        warningAlert: "Violent 38% drop in 4 weeks. Impulsive panic sellers locked in massive permanent capital loss.",
      },
      {
        name: "2000 Dot-Com Tech Bubble Burst",
        marketDropPct: 45.0,
        maxDrawdownDurationMonths: 36,
        warningAlert: "High-valuation speculative names lost 70%+. Broad diversified portfolios recovered 3x faster.",
      },
    ];

    return scenarios.map((s) => {
      const equityLoss = (s.marketDropPct / 100) * equityVal;
      // Assume debt provides buffer (1% gain during flight to safety)
      const debtGain = 0.02 * debtVal;
      const netLoss = Math.max(0, equityLoss - debtGain);
      const portfolioValueAfterCrash = Math.max(0, portfolioValue - netLoss);

      return {
        scenarioName: s.name,
        marketDropPct: s.marketDropPct,
        estimatedLoss: Math.round(netLoss),
        portfolioValueAfterCrash: Math.round(portfolioValueAfterCrash),
        maxDrawdownDurationMonths: s.maxDrawdownDurationMonths,
        warningAlert: s.warningAlert,
      };
    });
  }
}
