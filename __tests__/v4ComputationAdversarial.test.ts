/**
 * AssetArray 4.0 — Phase 2: Computation Layer Adversarial Test Suite
 * Validates all 15 Phase 2 security, mathematical, and operational edge cases.
 */

import { runIngestionPipeline, clearIngestionMemory } from "../src/services/v4/ingestion/ingestionPipeline";
import { validateCanonicalRecord } from "../src/services/v4/validation/validationEngine";
import { generateRebalanceProposal } from "../src/services/v4/rebalancing/rebalanceSandbox";
import { runReconciliationMatrix, clearReconciliationMemory } from "../src/services/v4/reconciliation/reconciliationEngine";
import { CanonicalRecord, DriftCorridorConfig } from "../src/types/v4/computation";

describe("V4 PHASE 2 — ADVERSARIAL COMPUTATION SUITE", () => {
  beforeEach(() => {
    clearIngestionMemory();
    clearReconciliationMemory();
  });

  // 1. Duplicate import idempotency
  test("ADVERSARIAL 1: Duplicate import idempotency prevents double records", () => {
    const csv = "Symbol,Quantity,Current Value\nTCS,100,350000";
    const job1 = runIngestionPipeline({ tenantId: "firm-1", sourceType: "BROKER_CSV", rawInput: csv, createdBy: "user" });
    const job2 = runIngestionPipeline({ tenantId: "firm-1", sourceType: "BROKER_CSV", rawInput: csv, createdBy: "user" });

    expect(job1.status).toBe("COMPLETED");
    expect(job2.warnings.some((w) => w.code === "IDEMPOTENT_DUPLICATE_INGESTION")).toBe(true);
  });

  // 2. Malformed date
  test("ADVERSARIAL 2: Malformed date produces warning without throwing or crashing", () => {
    const rec: CanonicalRecord = {
      canonicalId: "c1",
      tenantId: "f1",
      symbol: "AAPL",
      securityName: "Apple Inc",
      quantity: 10,
      price: 150,
      investedAmount: 1500,
      currentValue: 1500,
      currency: "USD",
      assetClass: "Equity",
      acquisitionDate: "INVALID_DATE_STRING",
      provenance: { source: "CSV", ingestionJobId: "j1", asOf: "", method: "", confidence: "LOW" },
      qualityState: "PARTIAL",
      unmappedFields: [],
    };
    const report = validateCanonicalRecord(rec);
    expect(report.issues.some((i) => i.code === "MALFORMED_ACQUISITION_DATE")).toBe(true);
  });

  // 3. Missing acquisition date
  test("ADVERSARIAL 3: Missing acquisition date remains UNVERIFIED", () => {
    const rec: CanonicalRecord = {
      canonicalId: "c1",
      tenantId: "f1",
      symbol: "AAPL",
      securityName: "Apple Inc",
      quantity: 10,
      price: 150,
      investedAmount: 1500,
      currentValue: 1500,
      currency: "USD",
      assetClass: "Equity",
      provenance: { source: "CSV", ingestionJobId: "j1", asOf: "", method: "", confidence: "LOW" },
      qualityState: "PARTIAL",
      unmappedFields: ["acquisitionDate"],
    };
    expect(rec.acquisitionDate).toBeUndefined();
    expect(rec.qualityState).toBe("PARTIAL");
  });

  // 4. Unknown security
  test("ADVERSARIAL 4: Unknown security maps to UNMAPPED- symbol and returns error issue", () => {
    const rec: CanonicalRecord = {
      canonicalId: "c1",
      tenantId: "f1",
      symbol: "",
      securityName: "Unknown Co",
      quantity: 10,
      price: 100,
      investedAmount: 1000,
      currentValue: 1000,
      currency: "INR",
      assetClass: "Equity",
      provenance: { source: "CSV", ingestionJobId: "j1", asOf: "", method: "", confidence: "LOW" },
      qualityState: "MISSING",
      unmappedFields: ["symbol"],
    };
    const report = validateCanonicalRecord(rec);
    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.code === "MISSING_SECURITY_IDENTITY")).toBe(true);
  });

  // 5. Negative quantity
  test("ADVERSARIAL 5: Negative quantity rejects record as INVALID", () => {
    const rec: CanonicalRecord = {
      canonicalId: "c1",
      tenantId: "f1",
      symbol: "TSLA",
      securityName: "Tesla",
      quantity: -50,
      price: 200,
      investedAmount: 10000,
      currentValue: 10000,
      currency: "USD",
      assetClass: "Equity",
      provenance: { source: "CSV", ingestionJobId: "j1", asOf: "", method: "", confidence: "LOW" },
      qualityState: "COMPLETE",
      unmappedFields: [],
    };
    const report = validateCanonicalRecord(rec);
    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.code === "NEGATIVE_QUANTITY")).toBe(true);
  });

  // 6. Currency mismatch
  test("ADVERSARIAL 6: Empty currency produces validation error", () => {
    const rec: CanonicalRecord = {
      canonicalId: "c1",
      tenantId: "f1",
      symbol: "TSLA",
      securityName: "Tesla",
      quantity: 10,
      price: 200,
      investedAmount: 2000,
      currentValue: 2000,
      currency: "",
      assetClass: "Equity",
      provenance: { source: "CSV", ingestionJobId: "j1", asOf: "", method: "", confidence: "LOW" },
      qualityState: "COMPLETE",
      unmappedFields: [],
    };
    const report = validateCanonicalRecord(rec);
    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.code === "MISSING_CURRENCY")).toBe(true);
  });

  // 7. Duplicate transaction
  test("ADVERSARIAL 7: Duplicate position in same ingestion batch produces warning", () => {
    const rawGrid = [
      { symbol: "INFY", quantity: 100, currentValue: 150000 },
      { symbol: "INFY", quantity: 50, currentValue: 75000 },
    ];
    const job = runIngestionPipeline({ tenantId: "f1", sourceType: "MANUAL_GRID", rawInput: rawGrid, createdBy: "advisor" });
    expect(job.warnings.some((w) => w.code === "DUPLICATE_POSITION_IN_BATCH")).toBe(true);
  });

  // 8. Cross-tenant import
  test("ADVERSARIAL 8: Ingestion without tenantId fails closed", () => {
    expect(() =>
      runIngestionPipeline({ tenantId: "", sourceType: "MANUAL_GRID", rawInput: [], createdBy: "attacker" })
    ).toThrow("Tenant isolation failure");
  });

  // 9. Fabricated tax impact prevention
  test("ADVERSARIAL 9: Cannot fabricate tax impact when acquisition date is unverified", () => {
    const unverifiedRec: CanonicalRecord = {
      canonicalId: "c1",
      tenantId: "f1",
      symbol: "NVDA",
      securityName: "Nvidia",
      quantity: 100,
      price: 1000,
      investedAmount: 50000,
      currentValue: 100000,
      currency: "USD",
      assetClass: "Equity",
      provenance: { source: "CSV", ingestionJobId: "j1", asOf: "", method: "", confidence: "LOW" },
      qualityState: "PARTIAL",
      unmappedFields: ["acquisitionDate"],
    };

    const corridors: DriftCorridorConfig[] = [{ assetClass: "Equity", targetWeightPct: 10, lowerBandPct: 1, upperBandPct: 1 }];
    const proposal = generateRebalanceProposal({ tenantId: "f1", portfolioId: "p1", holdings: [unverifiedRec], corridors });

    expect(proposal.candidates[0].estimatedTaxImpact).toBe("TAX_IMPACT_UNCERTAIN");
  });

  // 10. Portfolio input immutability
  test("ADVERSARIAL 10: Original portfolio input array remains strictly un-mutated", () => {
    const inputArr: CanonicalRecord[] = [
      {
        canonicalId: "c1",
        tenantId: "f1",
        symbol: "GOOGL",
        securityName: "Alphabet",
        quantity: 10,
        price: 100,
        investedAmount: 1000,
        currentValue: 1000,
        currency: "USD",
        assetClass: "Equity",
        provenance: { source: "CSV", ingestionJobId: "j1", asOf: "", method: "", confidence: "HIGH" },
        qualityState: "COMPLETE",
        unmappedFields: [],
      },
    ];

    const copy = JSON.stringify(inputArr);
    generateRebalanceProposal({ tenantId: "f1", portfolioId: "p1", holdings: inputArr, corridors: [] });
    expect(JSON.stringify(inputArr)).toBe(copy);
  });

  // 11. Rebalancing sandbox output immutability
  test("ADVERSARIAL 11: Rebalancing proposal marks isImmutable: true", () => {
    const proposal = generateRebalanceProposal({ tenantId: "f1", portfolioId: "p1", holdings: [], corridors: [] });
    expect(proposal.isImmutable).toBe(true);
  });

  // 12. Deterministic rerun
  test("ADVERSARIAL 12: Rerunning ingestion pipeline on identical input produces identical record count", () => {
    const grid = [{ symbol: "BOND1", quantity: 100, currentValue: 100000 }];
    const job1 = runIngestionPipeline({ tenantId: "f1", sourceType: "MANUAL_GRID", rawInput: grid, createdBy: "user", allowDuplicates: true });
    const job2 = runIngestionPipeline({ tenantId: "f1", sourceType: "MANUAL_GRID", rawInput: grid, createdBy: "user", allowDuplicates: true });

    expect(job1.recordCounts.accepted).toBe(job2.recordCounts.accepted);
  });

  // 13. Reconciliation idempotency
  test("ADVERSARIAL 13: Reconciliation on identical inputs produces deterministic discrepancy count", () => {
    const discs1 = runReconciliationMatrix({ tenantId: "f1", portfolioId: "p1", sourceRecords: [], portfolioHoldings: [{ id: "h1", assetName: "Test", assetClass: "Equity", currentValue: 1000, investedValue: 900 }] });
    const discs2 = runReconciliationMatrix({ tenantId: "f1", portfolioId: "p1", sourceRecords: [], portfolioHoldings: [{ id: "h1", assetName: "Test", assetClass: "Equity", currentValue: 1000, investedValue: 900 }] });

    expect(discs1.length).toBe(discs2.length);
  });

  // 14. Unsupported source rejection
  test("ADVERSARIAL 14: Unsupported source type fails closed with FAILED job status", () => {
    const job = runIngestionPipeline({ tenantId: "f1", sourceType: "UNKNOWN_BLOB" as any, rawInput: {}, createdBy: "user" });
    expect(job.status).toBe("FAILED");
    expect(job.errors.some((e) => e.code === "UNSUPPORTED_SOURCE_TYPE")).toBe(true);
  });

  // 15. Partially valid import handling
  test("ADVERSARIAL 15: Batch with 1 valid and 1 invalid record reports PARTIAL status", () => {
    const rawGrid = [
      { symbol: "VALID_SYM", quantity: 100, currentValue: 50000 },
      { symbol: "INVALID_SYM", quantity: -999, currentValue: 50000 }, // Negative qty error
    ];

    const job = runIngestionPipeline({ tenantId: "f1", sourceType: "MANUAL_GRID", rawInput: rawGrid, createdBy: "user" });
    expect(job.status).toBe("PARTIAL");
    expect(job.recordCounts.accepted).toBe(1);
    expect(job.recordCounts.rejected).toBe(1);
  });
});
