/**
 * AssetArray 4.0 — Backend Ingestion Model & Schema
 */

const memIngestionJobs = new Map();

class IngestionModel {
  static createJob(params, firmId) {
    if (!firmId) throw new Error("firmId is required for IngestionJob.");
    const job = {
      jobId: params.jobId || `job-${Date.now()}`,
      firmId,
      sourceType: params.sourceType || "UNKNOWN",
      sourceName: params.sourceName || params.sourceType || "UNKNOWN",
      status: params.status || "PENDING",
      startedAt: params.startedAt || new Date().toISOString(),
      completedAt: params.completedAt,
      recordCounts: params.recordCounts || { totalRaw: 0, accepted: 0, rejected: 0, unmapped: 0 },
      warnings: params.warnings || [],
      errors: params.errors || [],
      provenance: params.provenance || {},
      createdBy: params.createdBy || "system",
      records: params.records || [],
    };
    memIngestionJobs.set(job.jobId, job);
    return job;
  }

  static getJobById(jobId, firmId) {
    const job = memIngestionJobs.get(jobId);
    if (!job || job.firmId !== firmId) return null;
    return job;
  }

  static listJobs(firmId, limit = 50) {
    return Array.from(memIngestionJobs.values())
      .filter((j) => j.firmId === firmId)
      .slice(0, limit);
  }

  static clear() {
    memIngestionJobs.clear();
  }
}

module.exports = { IngestionModel };
