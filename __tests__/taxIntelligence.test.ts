import {
  generateTaxHarvestReport,
  INDIAN_TAX_RATES,
} from "../src/services/taxIntelligence";
import { PortfolioHolding } from "../src/types/wealth";

describe("Indian Tax Intelligence & Loss Harvesting Engine", () => {
  const mockHoldings: PortfolioHolding[] = [
    {
      id: "h1",
      assetName: "Midcap Emerging Leaders",
      assetClass: "Stocks",
      ticker: "MIDCAP",
      quantity: "200",
      investedValue: "500000",
      currentValue: "400000", // ₹100,000 loss (Short Term, 20% shield)
      targetWeight: "40",
      notes: "Short term tactical position",
    },
    {
      id: "h2",
      assetName: "Large Cap Bluechip ETF",
      assetClass: "Stocks",
      ticker: "NIFTYBEES",
      quantity: "500",
      investedValue: "600000",
      currentValue: "850000", // ₹250,000 gain (Long Term)
      targetWeight: "40",
      notes: "Core LT holding",
    },
    {
      id: "h3",
      assetName: "Banking Smallcap",
      assetClass: "Stocks",
      ticker: "SMALLBANK",
      quantity: "100",
      investedValue: "200000",
      currentValue: "160000", // ₹40,000 loss
      targetWeight: "20",
      notes: "Speculative dip",
    },
  ];

  it("applies Finance Act 2024 tax rates: STCG 20% and LTCG 12.5%", () => {
    expect(INDIAN_TAX_RATES.STCG_EQUITY_PCT).toBe(20.0);
    expect(INDIAN_TAX_RATES.LTCG_EQUITY_PCT).toBe(12.5);
    expect(INDIAN_TAX_RATES.LTCG_EXEMPTION_THRESHOLD).toBe(125000);
  });

  it("identifies loss harvesting candidates and computes potential tax shield", () => {
    const report = generateTaxHarvestReport(mockHoldings, {
      shortTerm: 50000,
      longTerm: 200000,
    });

    expect(report.totalHarvestableLoss).toBe(140000); // 100k + 40k
    expect(report.estimatedImmediateTaxSavings).toBeGreaterThan(0);
    expect(report.harvestCandidates.length).toBe(3);

    const harvestLots = report.harvestCandidates.filter(
      (c) => c.isLossHarvestCandidate
    );
    expect(harvestLots.length).toBe(2);
    expect(harvestLots[0].suggestedAction).toBe("HARVEST_LOSS");
  });

  it("applies the ₹1.25 Lakh exemption limit against long-term capital gains", () => {
    // If realized LT gains are 200,000, and 125,000 is exempt, taxable is 75,000 (if unshielded)
    const report = generateTaxHarvestReport(mockHoldings, {
      shortTerm: 0,
      longTerm: 200000,
    });

    expect(report.ltcgExemptionAvailable).toBe(125000);
    expect(report.ltcgExemptionUtilized).toBeGreaterThan(0);
    expect(report.statutoryDisclaimer).toContain("Finance Act 2024");
  });
});
