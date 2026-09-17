/**
 * AssetArray 4.0 — Phase 2: Reconciliation Subsystem Tests
 */

import { runReconciliationMatrix, resolveDiscrepancy, clearReconciliationMemory } from "../src/services/v4/reconciliation/reconciliationEngine";
import { CanonicalRecord } from "../src/types/v4/computation";
import { SimpleHolding } from "../src/services/rebalancer";

describe("V4 PHASE 2 — RECONCILIATION ENGINE SUITE", () => {
  beforeEach(() => {
    clearReconciliationMemory();
  });

  const sampleSource: CanonicalRecord[] = [
    {
      canonicalId: "c1",
      tenantId: "firm-alpha",
      symbol: "HDFCBANK",
      securityName: "HDFC Bank",
      quantity: 500,
      price: 1600,
      investedAmount: 700000,
      currentValue: 800000,
      currency: "INR",
      assetClass: "Equity",
      provenance: { source: "CAMS_CAS", ingestionJobId: "j1", asOf: "", method: "", confidence: "HIGH" },
      qualityState: "COMPLETE",
      unmappedFields: [],
    },
    {
      canonicalId: "c2",
      tenantId: "firm-alpha",
      symbol: "RELIANCE",
      securityName: "Reliance Industries",
      quantity: 1000, // Stock split 2:1 pattern vs portfolio ledger (500)
      price: 2800,
      investedAmount: 2000000,
      currentValue: 2800000,
      currency: "INR",
      assetClass: "Equity",
      provenance: { source: "CAMS_CAS", ingestionJobId: "j1", asOf: "", method: "", confidence: "HIGH" },
      qualityState: "COMPLETE",
      unmappedFields: [],
    },
  ];

  const sampleHoldings: SimpleHolding[] = [
    { id: "h1", assetName: "HDFC Bank", assetClass: "Equity", currentValue: 800000, investedValue: 700000, quantity: 500, symbol: "HDFCBANK" },
    { id: "h2", assetName: "Reliance Industries", assetClass: "Equity", currentValue: 1400000, investedValue: 1000000, quantity: 500, symbol: "RELIANCE" },
    { id: "h3", assetName: "Infosys Ltd", assetClass: "Equity", currentValue: 500000, investedValue: 400000, quantity: 300, symbol: "INFY" },
  ];

  test("1. Detects Corporate Action Stock Split break and flags review requirement", () => {
    const discrepancies = runReconciliationMatrix({
      tenantId: "firm-alpha",
      portfolioId: "port-101",
      sourceRecords: sampleSource,
      portfolioHoldings: sampleHoldings,
    });

    const splitDisc = discrepancies.find((d) => d.entity.symbol === "RELIANCE");
    expect(splitDisc).toBeDefined();
    expect(splitDisc!.type).toBe("CORPORATE_ACTION_MISMATCH");
    expect(splitDisc!.requiresCorporateActionReview).toBe(true);
  });

  test("2. Detects missing position in source ledger", () => {
    const discrepancies = runReconciliationMatrix({
      tenantId: "firm-alpha",
      portfolioId: "port-101",
      sourceRecords: sampleSource,
      portfolioHoldings: sampleHoldings,
    });

    const infyDisc = discrepancies.find((d) => d.entity.symbol === "INFY");
    expect(infyDisc).toBeDefined();
    expect(infyDisc!.type).toBe("MISSING_POSITION");
    expect(infyDisc!.severity).toBe("CRITICAL");
  });

  test("3. Resolves discrepancy and records audit payload", () => {
    const discrepancies = runReconciliationMatrix({
      tenantId: "firm-alpha",
      portfolioId: "port-101",
      sourceRecords: sampleSource,
      portfolioHoldings: sampleHoldings,
    });

    const disc = discrepancies[0];
    const resolved = resolveDiscrepancy(disc.discrepancyId, "firm-alpha", "ops-lead", "Corporate action verified");
    expect(resolved).not.toBeNull();
    expect(resolved!.status).toBe("RESOLVED");
    expect(resolved!.resolvedBy).toBe("ops-lead");
  });
});
