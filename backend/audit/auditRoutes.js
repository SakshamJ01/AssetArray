/**
 * AssetArray 4.0 — Compliance Audit Log Routes
 * Exposes immutable audit event records strictly scoped by firm tenant.
 */

const express = require("express");
const { requirePermission } = require("../auth/middleware");
const { PERMISSIONS } = require("../auth/rbac");
const { auditLogger } = require("./auditLogger");

function createAuditRouter() {
  const router = express.Router();

  // GET /api/v4/audit/events — Retrieve firm audit ledger
  router.get("/events", requirePermission(PERMISSIONS.AUDIT_READ), async (req, res) => {
    try {
      const firmId = req.tenant.firmId;
      const { limit, entityType, entityId } = req.query;

      const events = await auditLogger.getEvents(firmId, {
        limit: Number(limit) || 100,
        entityType,
        entityId,
      });

      res.json({
        ok: true,
        firmId,
        total: events.length,
        events,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to load audit events." });
    }
  });

  return router;
}

module.exports = { createAuditRouter };
