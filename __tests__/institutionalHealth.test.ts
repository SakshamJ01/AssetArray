import {
  calculateInstitutionalHealthScore,
  HEALTH_SCORE_METHODOLOGY_VERSION,
} from "../src/services/health";
import { PortfolioHolding } from "../src/types/wealth";

describe("Institutional Explainable Health Score Engine", () => {
  const holdings: PortfolioHolding[] = [
    {
      id: "h1",
      assetName: "Infosys Ltd",
      assetClass: "Stocks",
      ticker: "INFY.NS",
      quantity: "100",
      investedValue: "140000",
      currentValue: "180000",
      targetWeight: "0.20",
      notes: "Large cap IT",
      country: "India",
      currency: "INR",
      sector: "Technology",
    },
    {
      id: "h2",
      assetName: "Vanguard S&P 500 ETF",
      assetClass: "Mutual Funds",
      ticker: "VOO",
      quantity: "10",
      investedValue: "300000",
      currentValue: "350000",
      targetWeight: "0.40",
      notes: "US core equity",
      country: "US",
      currency: "USD",
      sector: "Diversified",
    },
    {
      id: "h3",
      assetName: "Govt of India Gilt 2033",
      assetClass: "Bonds",
      ticker: "GILT2033",
      quantity: "200",
      investedValue: "200000",
      currentValue: "210000",
      targetWeight: "0.25",
      notes: "Sovereign fixed income",
      country: "India",
      currency: "INR",
      sector: "Sovereign Debt",
    },
    {
      id: "h4",
      assetName: "Overnight Treasury Cash",
      assetClass: "Cash",
      ticker: "CASH",
      quantity: "1",
      investedValue: "80000",
      currentValue: "80000",
      targetWeight: "0.15",
      notes: "Liquid buffer",
      country: "India",
      currency: "INR",
      sector: "Cash",
    },
  ];

  it("exposes structured evidence, factors, and methodology version", () => {
    const result = calculateInstitutionalHealthScore(holdings, 0, "test-port");

    expect(result.methodologyVersion).toBe(HEALTH_SCORE_METHODOLOGY_VERSION);
    expect(result.detailedFactors.length).toBe(7);
    expect(result.confidence).toBe("HIGH");
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(typeof result.explanation).toBe("string");

    // Check specific evidence points
    const largestEv = result.evidence.find((e) => e.metric === "largestHoldingWeight");
    expect(largestEv).toBeDefined();
    expect(typeof largestEv?.value).toBe("number");
  });

  it("supports configuration-driven custom factor weights", () => {
    // Overweight concentration to 80% of total score
    const customConfig = {
      weights: {
        concentration: 0.80,
        assetDiversification: 0.20,
        dataQuality: 0,
        geographicExposure: 0,
        liquidity: 0,
        liability: 0,
        goalAlignment: 0,
      },
    };
    const result = calculateInstitutionalHealthScore(holdings, 0, "custom-config", undefined, customConfig);
    expect(result.healthScore).toBeGreaterThanOrEqual(70);
  });
});
