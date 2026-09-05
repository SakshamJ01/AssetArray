import { TaxRuleSet } from "./types";

export const TAX_ENGINE_METHODOLOGY_VERSION = "in-tax-finance-act-2024-v1.1";

export const STATUTORY_TAX_DISCLAIMER =
  "Tax projections are computed strictly for educational and portfolio diagnostic purposes under the provisions of the Indian Income Tax Act, 1961 (as amended by Finance Act 2024 / FY 2025-26, AY 2026-27). India does not possess statutory US IRC §1091 wash-sale rules; however, trades executed without commercial substance may face scrutiny under General Anti-Avoidance Rules (GAAR). All tax harvesting figures are non-binding estimates. Consult a certified Chartered Accountant (CA) or qualified tax professional prior to trade execution.";

/**
 * Authoritative Indian Tax Ruleset under Finance Act 2024
 */
export const DEFAULT_INDIAN_TAX_RULESET: TaxRuleSet = {
  jurisdiction: "IN",
  financialYear: "2025-26",
  assessmentYear: "AY 2026-27",
  effectiveFrom: "2024-07-23",
  effectiveTo: "2026-03-31",
  source: "Ministry of Finance, Government of India — Finance Act 2024 (Sections 111A, 112A, 50AA, 70, 74)",
  lastVerified: "2026-04-01",
  rates: {
    stcgEquityPct: 20.0, // Section 111A: 20% on listed equity / equity MF units
    ltcgEquityPct: 12.5, // Section 112A: 12.5% on listed equity / equity MF units
    ltcgExemptionLimit: 125000, // Section 112A: ₹1,25,000 aggregate annual threshold
    debtMarginalRatePct: 30.0, // Section 50AA: marginal slab rate for specified debt funds
    surchargePct: 0.0, // Baseline without high-income surcharge
    cessPct: 4.0, // Health & Education Cess: 4% on (Tax + Surcharge)
  },
  holdingPeriodRules: [
    {
      assetClass: "Stocks",
      isListed: true,
      thresholdMonths: 12, // Section 2(42A): 12 months for listed equity
    },
    {
      assetClass: "Mutual Funds",
      isListed: true,
      thresholdMonths: 12, // Equity oriented units: 12 months
    },
    {
      assetClass: "Bonds",
      isListed: true,
      thresholdMonths: 12, // Listed debentures: 12 months post-Finance Act 2024
    },
    {
      assetClass: "Alternatives",
      isListed: true,
      thresholdMonths: 24, // Gold, unlisted, physical real estate: 24 months
    },
    {
      assetClass: "Cash",
      isListed: false,
      thresholdMonths: 36, // Cash equivalents: no capital gain concept
    },
  ],
};
