/**
 * AssetArray 4.0 — Master Ingestion Pipeline Engine
 * Orchestrates:
 * SOURCE → RAW RECORD → PARSER → NORMALIZER → VALIDATOR → PROVENANCE → CANONICAL RECORD → RECONCILIATION
 */

import { CanonicalRecord, IngestionJob, IngestionSourceType, RawSourceRecord, ValidationIssue } from "../../../types/v4/computation";
import { computeSourceFingerprint } from "./fingerprint";
import { REGISTERED_ADAPTERS } from "./ingestionAdapters";
import { normalizeRawRecord } from "../normalization/normalizer";
import { validateBatch } from "../validation/validationEngine";

const memIngestionStore = new Map<string, IngestionJob>();
const memFingerprints = new Set<string>();

export interface IngestionPipelineOptions {
  tenantId: string;
  sourceType: IngestionSourceType;
  sourceName?: string;
  rawInput: any;
  createdBy: string;
  allowDuplicates?: boolean;
}

export function runIngestionPipeline(options: IngestionPipelineOptions): IngestionJob {
  const { tenantId, sourceType, rawInput, createdBy } = options;
  const sourceName = options.sourceName || sourceType;

  // 1. Tenant & Security Check
  if (!tenantId || tenantId.trim().length === 0) {
    throw new Error("[IngestionPipeline] Tenant isolation failure: tenantId is required.");
  }

  // 2. Cryptographic Fingerprint & Idempotency Check
  const fingerprint = computeSourceFingerprint(tenantId, sourceType, rawInput);
  if (!options.allowDuplicates && memFingerprints.has(fingerprint)) {
    const existingJob = Array.from(memIngestionStore.values()).find(
      (j) => j.tenantId === tenantId && j.provenance.fingerprint === fingerprint
    );
    if (existingJob) {
      return {
        ...existingJob,
        status: "COMPLETED",
        warnings: [
          ...existingJob.warnings,
          {
            code: "IDEMPOTENT_DUPLICATE_INGESTION",
            message: "Source content matched existing fingerprint. Duplicate ingestion skipped.",
            severity: "WARNING",
          },
        ],
      };
    }
  }

  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();

  // 3. Adapter Selection & Raw Parsing
  const adapter = REGISTERED_ADAPTERS.find(
    (a) => a.sourceType === sourceType || (a.supports && a.supports(rawInput))
  );

  if (!adapter) {
    const failedJob: IngestionJob = {
      jobId,
      tenantId,
      sourceType: "UNSUPPORTED",
      sourceName,
      status: "FAILED",
      startedAt,
      completedAt: new Date().toISOString(),
      recordCounts: { totalRaw: 0, accepted: 0, rejected: 0, unmapped: 0 },
      warnings: [],
      errors: [
        {
          code: "UNSUPPORTED_SOURCE_TYPE",
          message: `No supported ingestion adapter available for source '${sourceType}'.`,
          severity: "ERROR",
        },
      ],
      provenance: { fingerprint, createdBy },
      createdBy,
      records: [],
    };
    memIngestionStore.set(jobId, failedJob);
    return failedJob;
  }

  let rawRecords: RawSourceRecord[] = [];
  try {
    rawRecords = adapter.parse(rawInput);
  } catch (err: any) {
    const failedJob: IngestionJob = {
      jobId,
      tenantId,
      sourceType,
      sourceName,
      status: "FAILED",
      startedAt,
      completedAt: new Date().toISOString(),
      recordCounts: { totalRaw: 0, accepted: 0, rejected: 0, unmapped: 0 },
      warnings: [],
      errors: [
        {
          code: "PARSER_EXCEPTION",
          message: `Failed to parse source: ${err.message}`,
          severity: "ERROR",
        },
      ],
      provenance: { fingerprint, createdBy },
      createdBy,
      records: [],
    };
    memIngestionStore.set(jobId, failedJob);
    return failedJob;
  }

  if (rawRecords.length === 0) {
    const emptyJob: IngestionJob = {
      jobId,
      tenantId,
      sourceType,
      sourceName,
      status: "COMPLETED",
      startedAt,
      completedAt: new Date().toISOString(),
      recordCounts: { totalRaw: 0, accepted: 0, rejected: 0, unmapped: 0 },
      warnings: [
        {
          code: "EMPTY_SOURCE_INPUT",
          message: "Source contains zero records to ingest.",
          severity: "WARNING",
        },
      ],
      errors: [],
      provenance: { fingerprint, createdBy },
      createdBy,
      records: [],
    };
    memIngestionStore.set(jobId, emptyJob);
    memFingerprints.add(fingerprint);
    return emptyJob;
  }

  // 4. Normalization & Provenance Attribution
  const canonicalRecords: CanonicalRecord[] = rawRecords.map((raw) =>
    normalizeRawRecord(raw, tenantId, jobId, sourceName)
  );

  // 5. Validation Engine
  const { accepted, rejected, allIssues } = validateBatch(canonicalRecords);

  const errors = allIssues.filter((i) => i.severity === "ERROR");
  const warnings = allIssues.filter((i) => i.severity === "WARNING");

  let status: IngestionJob["status"] = "COMPLETED";
  if (accepted.length === 0 && rejected.length > 0) {
    status = "FAILED";
  } else if (rejected.length > 0) {
    status = "PARTIAL";
  }

  const job: IngestionJob = {
    jobId,
    tenantId,
    sourceType,
    sourceName,
    status,
    startedAt,
    completedAt: new Date().toISOString(),
    recordCounts: {
      totalRaw: rawRecords.length,
      accepted: accepted.length,
      rejected: rejected.length,
      unmapped: canonicalRecords.filter((c) => c.unmappedFields.length > 0).length,
    },
    warnings,
    errors,
    provenance: { fingerprint, createdBy },
    createdBy,
    records: accepted,
  };

  memIngestionStore.set(jobId, job);
  memFingerprints.add(fingerprint);

  return job;
}

export function getIngestionJob(jobId: string, tenantId: string): IngestionJob | null {
  const job = memIngestionStore.get(jobId);
  if (!job || job.tenantId !== tenantId) return null;
  return job;
}

export function clearIngestionMemory(): void {
  memIngestionStore.clear();
  memFingerprints.clear();
}
