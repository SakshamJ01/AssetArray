import { calculateAttribution, STANDARD_BENCHMARKS } from "../src/services/attribution";
import { calculateHealthScore } from "../src/services/healthScore";
import { PortfolioHolding } from "../src/types/wealth";

/**
 * Regression guard for the v4 "honest empty state" contract.
 *
 * The attribution + health engines have dedicated zero-holding branches. Those
 * branches must NOT emit fabricated-looking analytics (a fake bps table, a fake
 * "30/100 High Fragility" gauge) that the UI could mistake for real output.
 * The UI components gate rendering on these signals, so they must stay stable.
 */
describe("Honest empty-portfolio analytics (no fabricated data)", () => {
  it("attributes an empty portfolio as INSUFFICIENT_DATA with a zero return", () => {
    const result = calculateAttribution(
      [],
      STANDARD_BENCHMARKS.BALANCED_HYBRID,
      "empty-attr"
    );

    expect(result.portfolioReturn).toBe(0);
    expect(result.quality).toBe("INSUFFICIENT_DATA");
    expect(result.warnings).toContain("Portfolio has zero valuation or no holdings.");
    // The engine's own narrative must stay honest, not imply a measured alpha.
    expect(result.narrativeExplanation).toContain("holds no assets");
  });

  it("flags an empty portfolio health result as INSUFFICIENT_DATA", () => {
    const result = calculateHealthScore([], 0, "empty-health");

    // The UI relies on this exact confidence value to suppress the fabricated
    // 30/100 gauge and hardcoded factor bars.
    expect(result.confidence).toBe("INSUFFICIENT_DATA");
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.explanation).toBe("No assets found in portfolio.");
  });

  it("does not flag a populated portfolio as INSUFFICIENT_DATA", () => {
    const holdings: PortfolioHolding[] = [
      {
        id: "h1",
        assetName: "Infosys Ltd",
        assetClass: "Stocks",
        ticker: "INFY",
        quantity: "500",
        investedValue: "600000",
        currentValue: "750000",
        targetWeight: "100",
        notes: "Core IT holding",
      },
    ];

    const attr = calculateAttribution(
      holdings,
      STANDARD_BENCHMARKS.BALANCED_HYBRID,
      "populated-attr"
    );
    expect(attr.quality).not.toBe("INSUFFICIENT_DATA");
    expect(attr.portfolioReturn).toBeGreaterThan(0);

    const health = calculateHealthScore(holdings, 0, "populated-health");
    expect(health.confidence).not.toBe("INSUFFICIENT_DATA");
    expect(health.explanation).not.toBe("No assets found in portfolio.");
  });
});
