import {
  extractNumericClaims,
  validateClaimsAgainstContext,
} from "../src/services/aiGateway/grounding";

describe("AI Numerical Grounding Engine", () => {
  it("extracts all numerical claims with currency, percentage, and point magnitudes", () => {
    const aiText =
      "Portfolio AUM stands at ₹2.40 Cr, showing a +14.2% return with health score of 82 pts and tax loss of ₹3.5 L.";

    const claims = extractNumericClaims(aiText);
    expect(claims.length).toBe(4);

    const aumClaim = claims.find((c) => c.rawMatched.includes("2.40 Cr"));
    expect(aumClaim).toBeDefined();
    expect(aumClaim?.value).toBe(24000000);
    expect(aumClaim?.unit).toBe("INR");

    const returnClaim = claims.find((c) => c.rawMatched.includes("14.2%"));
    expect(returnClaim).toBeDefined();
    expect(returnClaim?.value).toBe(14.2);
    expect(returnClaim?.unit).toBe("PERCENT");

    const healthClaim = claims.find((c) => c.rawMatched.includes("82 pts"));
    expect(healthClaim).toBeDefined();
    expect(healthClaim?.value).toBe(82);
    expect(healthClaim?.unit).toBe("POINTS");

    const taxClaim = claims.find((c) => c.rawMatched.includes("3.5 L"));
    expect(taxClaim).toBeDefined();
    expect(taxClaim?.value).toBe(350000);
    expect(taxClaim?.unit).toBe("INR");
  });

  it("marks all claims as VERIFIED when numbers match context records", () => {
    const text = "Total AUM is ₹4.80 Cr with a portfolio health of 85 pts.";
    const context = {
      totalAum: 48000000,
      healthScore: 85,
    };

    const claims = extractNumericClaims(text);
    const report = validateClaimsAgainstContext(claims, context);

    expect(report.isFullyGrounded).toBe(true);
    expect(report.verifiedClaimsCount).toBe(2);
    expect(report.unverifiedClaimsCount).toBe(0);
    expect(report.groundingPct).toBe(100);
    expect(report.disclaimer).toBeUndefined();
  });

  it("flags unsupported numerical claims as UNVERIFIED with clear disclaimer", () => {
    const text =
      "Total AUM is ₹4.80 Cr, and we estimate hidden tax penalties of ₹75.0 L with 99.5% certainty.";
    const context = {
      totalAum: 48000000,
      // No 75.0 L or 99.5% in context!
    };

    const claims = extractNumericClaims(text);
    const report = validateClaimsAgainstContext(claims, context);

    expect(report.isFullyGrounded).toBe(false);
    expect(report.verifiedClaimsCount).toBe(1); // Only AUM verified
    expect(report.unverifiedClaimsCount).toBe(2); // 75.0 L and 99.5% unverified
    expect(report.disclaimer).toContain("2 numerical statement(s) could not be verified");

    const unverifiedClaims = report.claims.filter((c) => c.status === "UNVERIFIED");
    expect(unverifiedClaims.length).toBe(2);
  });

  it("handles empty input or missing numbers gracefully", () => {
    const text = "The portfolio is well diversified across sectors with balanced risk.";
    const claims = extractNumericClaims(text);
    expect(claims.length).toBe(0);

    const report = validateClaimsAgainstContext(claims, undefined);
    expect(report.isFullyGrounded).toBe(true);
    expect(report.totalClaimsCount).toBe(0);
  });
});
