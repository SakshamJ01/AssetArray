import {
  calculateStatutoryCapitalGainsTax,
  calculateLotHoldingMonths,
  classifyLotTerm,
  evaluateTaxLots,
  DEFAULT_INDIAN_TAX_RULESET,
  generateInstitutionalTaxReport,
} from "../src/services/tax";
import { PortfolioHolding } from "../src/types/wealth";

describe("Institutional Indian Tax Engine (Finance Act 2024 / AY 2026-27)", () => {
  describe("Date-Driven Holding Period & Lot Classification", () => {
    it("calculates exact months between acquisition date and as-of date", () => {
      const months = calculateLotHoldingMonths("2023-01-01", "2024-01-01");
      expect(months).toBeCloseTo(12.0, 1);
    });

    it("correctly classifies > 12 months equity as Long Term", () => {
      const { isLongTerm } = classifyLotTerm("Stocks", 14.5);
      expect(isLongTerm).toBe(true);
    });

    it("correctly classifies < 12 months equity as Short Term", () => {
      const { isLongTerm } = classifyLotTerm("Stocks", 5.2);
      expect(isLongTerm).toBe(false);
    });

    it("emits null when acquisition date is invalid or missing", () => {
      const months = calculateLotHoldingMonths("invalid-date");
      expect(months).toBeNull();
      const { isLongTerm } = classifyLotTerm("Stocks", months);
      expect(isLongTerm).toBeNull();
    });
  });

  describe("Section 70 / 74 Statutory Loss Set-Off Hierarchy", () => {
    it("STRICT: Long-Term Capital Loss (LTCL) can ONLY offset LTCG, NOT STCG", () => {
      // Scenario:
      // Realized STCG: ₹2,00,000
      // Realized LTCG: ₹0
      // Realized LTCL: ₹1,50,000
      // In Indian law, LTCL CANNOT offset STCG!
      // STCG must remain ₹2,00,000 taxable at 20% + 4% cess.
      // LTCL of ₹1,50,000 remains unabsorbed to carry forward.
      const result = calculateStatutoryCapitalGainsTax({
        realizedSTCG: 200000,
        realizedLTCG: 0,
        realizedLTCL: 150000,
      });

      expect(result.netSTCG).toBe(200000);
      expect(result.ltclUtilizedAgainstLTCG).toBe(0);
      expect(result.unabsorbedLTCL).toBe(150000);
      // Tax = 200,000 * 20% = 40,000 + 4% cess (1,600) = 41,600
      expect(result.totalTaxLiability).toBeCloseTo(41600, 2);
    });

    it("STCL can offset STCG first, and remaining STCL can offset LTCG", () => {
      // Scenario:
      // Realized STCG: ₹50,000
      // Realized LTCG: ₹2,00,000
      // Realized STCL: ₹80,000
      // STCL offsets all 50k STCG -> remaining STCL = 30k.
      // Remaining 30k STCL offsets LTCG -> remaining LTCG = 170k.
      // LTCG exemption of 125k applies -> taxable LTCG = 45k.
      const result = calculateStatutoryCapitalGainsTax({
        realizedSTCG: 50000,
        realizedLTCG: 200000,
        realizedSTCL: 80000,
      });

      expect(result.stclUtilizedAgainstSTCG).toBe(50000);
      expect(result.stclUtilizedAgainstLTCG).toBe(30000);
      expect(result.netSTCG).toBe(0);
      expect(result.netLTCGPreExemption).toBe(170000);
      expect(result.ltcgExemptionUtilized).toBe(125000);
      expect(result.taxableLTCG).toBe(45000);
      // Tax = 45,000 * 12.5% = 5,625 + 4% cess (225) = 5,850
      expect(result.totalTaxLiability).toBeCloseTo(5850, 2);
    });
  });

  describe("Institutional Tax Report & Loss Harvesting", () => {
    it("evaluates date-driven lots and accurately calculates marginal tax savings", () => {
      const holdingsWithDates: PortfolioHolding[] = [
        {
          id: "h1",
          assetName: "Tata Consultancy Services",
          assetClass: "Stocks",
          ticker: "TCS.NS",
          quantity: "50",
          investedValue: "200000",
          currentValue: "160000", // ₹40,000 loss
          targetWeight: "0.50",
          notes: "",
          acquiredAt: "2024-03-01", // ~4 months ago -> Short term (<12m)
        },
        {
          id: "h2",
          assetName: "Reliance Industries",
          assetClass: "Stocks",
          ticker: "RELIANCE.NS",
          quantity: "100",
          investedValue: "250000",
          currentValue: "200000", // ₹50,000 loss
          targetWeight: "0.50",
          notes: "",
          acquiredAt: "2022-01-15", // > 2 years ago -> Long term (>12m)
        },
      ];

      const report = generateInstitutionalTaxReport(
        holdingsWithDates,
        { shortTerm: 50000, longTerm: 250000 },
        "tax-port",
        { asOfDate: "2024-07-01" }
      );

      expect(report.totalHarvestableLoss).toBe(90000);
      expect(report.harvestOpportunities.length).toBe(2);

      const stOpportunity = report.harvestOpportunities.find((o) => !o.isLongTerm);
      const ltOpportunity = report.harvestOpportunities.find((o) => o.isLongTerm);

      expect(stOpportunity).toBeDefined();
      expect(stOpportunity?.offsetCategory).toBe("STCG_AND_LTCG");

      expect(ltOpportunity).toBeDefined();
      expect(ltOpportunity?.offsetCategory).toBe("LTCG_ONLY");
    });
  });
});
