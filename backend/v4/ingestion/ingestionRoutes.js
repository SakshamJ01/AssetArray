/**
 * AssetArray 4.0 — Backend Ingestion API Routes
 * POST /api/v4/ingestion
 * GET /api/v4/ingestion/:id
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { IngestionModel } = require("./ingestionModel");
const { auditLogger } = require("../../audit/auditLogger");

function createIngestionRouter() {
  const router = express.Router();

  // POST /api/v4/ingestion
  router.post("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const { sourceType, sourceName, rawInput } = req.body;

      if (!sourceType || !rawInput) {
        return res.status(400).json({ error: "Missing required fields: sourceType and rawInput are required." });
      }

      // Record ingestion job creation
      const job = IngestionModel.createJob(
        {
          sourceType,
          sourceName,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          recordCounts: {
            totalRaw: Array.isArray(rawInput) ? rawInput.length : 1,
            accepted: Array.isArray(rawInput) ? rawInput.length : 1,
            rejected: 0,
            unmapped: 0,
          },
          createdBy: req.user?.username || "system",
        },
        firmId
      );

      // Log Phase 1 audit event
      await auditLogger.log({
        firmId,
        actorId: req.user?.id || "system",
        action: "INGESTION_CREATED",
        entityType: "INGESTION_JOB",
        entityId: job.jobId,
        details: { sourceType, sourceName, recordCount: job.recordCounts.totalRaw },
      });

      return res.status(201).json(job);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/v4/ingestion/:id
  router.get("/:id", (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const job = IngestionModel.getJobById(req.params.id, scope.firmId);
      if (!job) {
        return res.status(404).json({ error: "Ingestion job not found or unauthorized." });
      }
      return res.json(job);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createIngestionRouter };
