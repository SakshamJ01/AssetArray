/**
 * AssetArray 4.0 — Phase 2: Tax-Aware Rebalancing Sandbox Tests
 */

import { generateRebalanceProposal } from "../src/services/v4/rebalancing/rebalanceSandbox";
import { CanonicalRecord, DriftCorridorConfig } from "../src/types/v4/computation";

describe("V4 PHASE 2 — TAX-AWARE REBALANCING SANDBOX SUITE", () => {
  const sampleHoldings: CanonicalRecord[] = [
    {
      canonicalId: "c1",
      tenantId: "firm-alpha",
      symbol: "RELIANCE",
      securityName: "Reliance Industries",
      quantity: 500,
      price: 2800,
      investedAmount: 2000000,
      currentValue: 14000000, // 70% of 20M portfolio
      currency: "INR",
      assetClass: "Equity",
      acquisitionDate: "2022-01-15", // Verified date
      provenance: { source: "CSV", ingestionJobId: "j1", asOf: "", method: "", confidence: "HIGH" },
      qualityState: "COMPLETE",
      unmappedFields: [],
    },
    {
      canonicalId: "c2",
      tenantId: "firm-alpha",
      symbol: "HDFC_BOND",
      securityName: "HDFC Corporate Bond Fund",
      quantity: 10000,
      price: 600,
      investedAmount: 5000000,
      currentValue: 6000000, // 30% of 20M portfolio
      currency: "INR",
      assetClass: "Fixed Income",
      provenance: { source: "CSV", ingestionJobId: "j1", asOf: "", method: "", confidence: "HIGH" },
      qualityState: "PARTIAL", // Missing acquisition date
      unmappedFields: ["acquisitionDate"],
    },
  ];

  const targetCorridors: DriftCorridorConfig[] = [
    { assetClass: "Equity", targetWeightPct: 50, lowerBandPct: 5, upperBandPct: 5 },
    { assetClass: "Fixed Income", targetWeightPct: 50, lowerBandPct: 5, upperBandPct: 5 },
  ];

  test("1. Portfolio input array is IMMUTABLE during calculation", () => {
    const originalJson = JSON.stringify(sampleHoldings);
    generateRebalanceProposal({
      tenantId: "firm-alpha",
      portfolioId: "port-101",
      holdings: sampleHoldings,
      corridors: targetCorridors,
    });
    expect(JSON.stringify(sampleHoldings)).toBe(originalJson);
  });

  test("2. Rebalance proposal detects overweight Equity and generates SELL candidate", () => {
    const proposal = generateRebalanceProposal({
      tenantId: "firm-alpha",
      portfolioId: "port-101",
      holdings: sampleHoldings,
      corridors: targetCorridors,
    });

    expect(proposal.isImmutable).toBe(true);
    expect(proposal.candidates).toHaveLength(2);

    const relCandidate = proposal.candidates.find((c) => c.securitySymbol === "RELIANCE");
    expect(relCandidate).toBeDefined();
    expect(relCandidate!.action).toBe("SELL");
    expect(relCandidate!.currentWeightPct).toBe(70);
    expect(relCandidate!.targetWeightPct).toBe(50);
  });

  test("3. Missing acquisition date returns TAX_IMPACT_UNCERTAIN without fabricating tax benefit", () => {
    // Force a sell scenario on holding with missing date
    const unverifiedHoldings: CanonicalRecord[] = [
      {
        ...sampleHoldings[1],
        currentValue: 14000000, // Make Fixed Income overweight
      },
      {
        ...sampleHoldings[0],
        currentValue: 6000000,
      },
    ];

    const proposal = generateRebalanceProposal({
      tenantId: "firm-alpha",
      portfolioId: "port-101",
      holdings: unverifiedHoldings,
      corridors: targetCorridors,
    });

    const bondCandidate = proposal.candidates.find((c) => c.securitySymbol === "HDFC_BOND");
    expect(bondCandidate).toBeDefined();
    expect(bondCandidate!.action).toBe("SELL");
    expect(bondCandidate!.estimatedTaxImpact).toBe("TAX_IMPACT_UNCERTAIN");
    expect(proposal.estimatedTaxImpactTotal).toBe("TAX_IMPACT_UNCERTAIN");
  });
});
