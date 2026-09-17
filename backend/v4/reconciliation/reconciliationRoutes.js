/**
 * AssetArray 4.0 — Backend Reconciliation API Routes
 * GET /api/v4/reconciliation
 * POST /api/v4/reconciliation/:id/resolve
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { ReconciliationModel } = require("./reconciliationModel");
const { auditLogger } = require("../../audit/auditLogger");

function createReconciliationRouter() {
  const router = express.Router();

  // GET /api/v4/reconciliation
  router.get("/", (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const status = req.query.status ? String(req.query.status).toUpperCase() : null;
      const discrepancies = ReconciliationModel.listDiscrepancies(scope.firmId, status);
      return res.json({ discrepancies, count: discrepancies.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/v4/reconciliation/:id/resolve
  router.post("/:id/resolve", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const { note } = req.body;
      const resolvedBy = req.user?.username || "system";

      const disc = ReconciliationModel.resolve(req.params.id, scope.firmId, resolvedBy, note);
      if (!disc) {
        return res.status(404).json({ error: "Discrepancy not found or unauthorized." });
      }

      await auditLogger.log({
        firmId: scope.firmId,
        actorId: req.user?.id || "system",
        action: "RECONCILIATION_RESOLVED",
        entityType: "DISCREPANCY",
        entityId: disc.discrepancyId,
        details: { status: disc.status, resolvedBy, note },
      });

      return res.json(disc);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createReconciliationRouter };
