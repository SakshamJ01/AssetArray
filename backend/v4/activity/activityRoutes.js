/**
 * AssetArray 4.0 — Backend Activity API Routes
 * Endpoint:
 * GET /api/v4/activity
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { auditLogger } = require("../../audit/auditLogger");

function createActivityRouter() {
  const router = express.Router();

  // GET /api/v4/activity
  router.get("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const { clientId, entityType, limit = 50 } = req.query;

      // Query from audit logger foundation
      const logs = await auditLogger.query({
        firmId,
        entityType,
        limit: parseInt(limit, 10) || 50
      });

      // Filter by clientId if requested
      const filtered = clientId
        ? logs.filter((l) => l.details && l.details.clientId === clientId)
        : logs;

      const results = filtered.map((l) => ({
        eventId: l.eventId || `act_${Date.now()}`,
        tenantId: l.firmId,
        eventType: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        actorId: l.actorId,
        timestamp: l.timestamp,
        clientId: l.details?.clientId,
        summary: l.details?.title || `${l.action} on ${l.entityType} (${l.entityId})`,
        metadata: l.details
      }));

      return res.status(200).json(results);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createActivityRouter };
