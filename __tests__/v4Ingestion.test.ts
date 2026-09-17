/**
 * AssetArray 4.0 — Phase 2: Ingestion & Normalization Unit & Integration Tests
 */

import { runIngestionPipeline, clearIngestionMemory } from "../src/services/v4/ingestion/ingestionPipeline";
import { normalizeRawRecord } from "../src/services/v4/normalization/normalizer";

describe("V4 PHASE 2 — INGESTION PIPELINE SUITE", () => {
  beforeEach(() => {
    clearIngestionMemory();
  });

  test("1. Ingests valid CSV input and normalizes into canonical records", () => {
    const csvData = `Symbol,Instrument,Quantity,Avg Price,LTP,Current Value
RELIANCE,Reliance Industries Ltd,250,2350.00,2890.50,722625
TCS,Tata Consultancy Services,120,3200.00,3840.00,460800`;

    const job = runIngestionPipeline({
      tenantId: "firm-alpha",
      sourceType: "STATEMENT_TEXT",
      sourceName: "Zerodha Kite Statement",
      rawInput: csvData,
      createdBy: "advisor-1",
    });

    expect(job.status).toBe("COMPLETED");
    expect(job.recordCounts.totalRaw).toBe(2);
    expect(job.recordCounts.accepted).toBe(2);
    expect(job.records).toHaveLength(2);

    const rel = job.records![0];
    expect(rel.symbol).toBe("RELIANCE");
    expect(rel.securityName).toBe("Reliance Industries Ltd");
    expect(rel.quantity).toBe(250);
    expect(rel.currentValue).toBe(722625);
    expect(rel.provenance.source).toBe("Zerodha Kite Statement");
    expect(rel.provenance.confidence).toBe("MEDIUM"); // Partial because missing acq date
  });

  test("2. Idempotency prevents duplicate ingestion when content matches fingerprint", () => {
    const csvData = `Symbol,Quantity,Current Value\nHDFCBANK,100,160000`;

    const job1 = runIngestionPipeline({
      tenantId: "firm-alpha",
      sourceType: "BROKER_CSV",
      rawInput: csvData,
      createdBy: "advisor-1",
    });
    expect(job1.status).toBe("COMPLETED");

    // Second ingestion with identical content
    const job2 = runIngestionPipeline({
      tenantId: "firm-alpha",
      sourceType: "BROKER_CSV",
      rawInput: csvData,
      createdBy: "advisor-1",
    });

    expect(job2.warnings.some((w) => w.code === "IDEMPOTENT_DUPLICATE_INGESTION")).toBe(true);
  });

  test("3. Fails closed on missing tenantId", () => {
    expect(() =>
      runIngestionPipeline({
        tenantId: "",
        sourceType: "MANUAL_GRID",
        rawInput: [],
        createdBy: "user",
      })
    ).toThrow("Tenant isolation failure");
  });

  test("4. Normalizer preserves unverified status when acquisition date is missing", () => {
    const raw = {
      recordId: "rec-101",
      rawFields: {
        symbol: "INFY",
        quantity: 50,
        currentValue: 80000,
      },
    };

    const canonical = normalizeRawRecord(raw, "firm-alpha", "job-1", "Manual");
    expect(canonical.acquisitionDate).toBeUndefined();
    expect(canonical.qualityState).toBe("PARTIAL");
    expect(canonical.unmappedFields).toContain("acquisitionDate");
  });
});
