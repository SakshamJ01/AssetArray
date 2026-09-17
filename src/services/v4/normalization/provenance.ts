/**
 * AssetArray 4.0 — Provenance Tracking Engine
 * Binds explicit metadata provenance to all ingested financial values.
 */

import { ProvenanceRecord } from "../../../types/v4/computation";

export function createProvenanceRecord(
  source: string,
  ingestionJobId: string,
  options: {
    sourceRecordId?: string;
    asOf?: string;
    method?: string;
    confidence?: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
    originalValue?: any;
  } = {}
): ProvenanceRecord {
  return {
    source: source || "UNKNOWN",
    sourceRecordId: options.sourceRecordId,
    ingestionJobId: ingestionJobId || "job_default",
    asOf: options.asOf || new Date().toISOString(),
    method: options.method || "DIRECT_INGESTION",
    confidence: options.confidence || "HIGH",
    originalValue: options.originalValue,
  };
}
