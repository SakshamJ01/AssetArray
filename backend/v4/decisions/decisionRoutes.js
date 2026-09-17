/**
 * AssetArray 4.0 — Backend Decisions API Routes
 * Endpoints:
 * GET /api/v4/decisions
 * POST /api/v4/decisions
 * GET /api/v4/decisions/:id
 * POST /api/v4/decisions/:id/approve
 * POST /api/v4/decisions/:id/reject
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { auditLogger } = require("../../audit/auditLogger");

const decisionsStore = new Map();

function getStore() {
  return decisionsStore;
}

function resetStore() {
  decisionsStore.clear();
}

function createDecisionRouter() {
  const router = express.Router();

  // GET /api/v4/decisions
  router.get("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const { clientId, householdId, portfolioId, decisionStatus, decisionType } = req.query;

      const results = [];
      for (const dec of decisionsStore.values()) {
        if (dec.tenantId !== firmId) continue;
        if (clientId && dec.clientId !== clientId) continue;
        if (householdId && dec.householdId !== householdId) continue;
        if (portfolioId && dec.portfolioId !== portfolioId) continue;
        if (decisionStatus && dec.decisionStatus !== decisionStatus) continue;
        if (decisionType && dec.decisionType !== decisionType) continue;
        results.push(dec);
      }

      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json(results);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/decisions
  router.post("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || req.body.createdBy || "system";

      const {
        clientId,
        householdId,
        portfolioId,
        decisionType,
        subject,
        context,
        evidence = {},
        beforeState = {},
        proposedAction = {},
        decisionStatus = "PENDING_APPROVAL",
        notes
      } = req.body;

      if (!clientId) return res.status(400).json({ error: "clientId is required" });
      if (!subject || subject.trim().length === 0) return res.status(400).json({ error: "subject is required" });
      if (!decisionType) return res.status(400).json({ error: "decisionType is required" });

      const decisionId = req.body.decisionId || `dec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const now = new Date().toISOString();

      const decisionRecord = {
        decisionId,
        tenantId: firmId,
        clientId,
        householdId,
        portfolioId,
        decisionType,
        subject: subject.trim(),
        context: context || "",
        evidence,
        beforeState,
        proposedAction,
        decision: "DEFER",
        decisionStatus,
        notes: notes || "",
        createdAt: now,
        updatedAt: now,
        version: 1
      };

      decisionsStore.set(decisionId, decisionRecord);

      await auditLogger.log({
        firmId,
        actorId,
        action: "DECISION_CREATED",
        entityType: "DECISION",
        entityId: decisionId,
        details: { clientId, subject: decisionRecord.subject, decisionType }
      });

      return res.status(201).json(decisionRecord);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/decisions/:id
  router.get("/:id", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const decisionId = req.params.id;

      const dec = decisionsStore.get(decisionId);
      if (!dec || dec.tenantId !== firmId) {
        return res.status(404).json({ error: `Decision ${decisionId} not found` });
      }

      return res.status(200).json(dec);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/decisions/:id/approve
  router.post("/:id/approve", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || req.body.actorId || "system";
      const actorRole = req.user?.role || req.body.actorRole || "ADVISOR";
      const decisionId = req.params.id;

      const dec = decisionsStore.get(decisionId);
      if (!dec || dec.tenantId !== firmId) {
        return res.status(404).json({ error: `Decision ${decisionId} not found` });
      }

      if (dec.decisionStatus === "APPROVED") {
        return res.status(409).json({ error: "Decision is already approved (double approval prevented)" });
      }

      if (!["ADVISOR", "ADMIN", "COMPLIANCE"].includes(actorRole)) {
        return res.status(403).json({ error: `Role ${actorRole} is not authorized to approve fiduciary decisions` });
      }

      const now = new Date().toISOString();
      dec.decision = "APPROVE";
      dec.decisionStatus = "APPROVED";
      dec.decidedBy = actorId;
      dec.decidedAt = now;
      if (req.body.notes) dec.notes = req.body.notes;
      dec.updatedAt = now;

      decisionsStore.set(decisionId, dec);

      await auditLogger.log({
        firmId,
        actorId,
        action: "DECISION_APPROVED",
        entityType: "DECISION",
        entityId: decisionId,
        details: { clientId: dec.clientId, subject: dec.subject, decidedBy: actorId }
      });

      return res.status(200).json(dec);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/decisions/:id/reject
  router.post("/:id/reject", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || req.body.actorId || "system";
      const actorRole = req.user?.role || req.body.actorRole || "ADVISOR";
      const decisionId = req.params.id;
      const { reason } = req.body;

      const dec = decisionsStore.get(decisionId);
      if (!dec || dec.tenantId !== firmId) {
        return res.status(404).json({ error: `Decision ${decisionId} not found` });
      }

      if (dec.decisionStatus === "REJECTED") {
        return res.status(409).json({ error: "Decision is already rejected" });
      }

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      if (!["ADVISOR", "ADMIN", "COMPLIANCE", "OPERATIONS"].includes(actorRole)) {
        return res.status(403).json({ error: `Role ${actorRole} is not authorized to reject fiduciary decisions` });
      }

      const now = new Date().toISOString();
      dec.decision = "REJECT";
      dec.decisionStatus = "REJECTED";
      dec.decidedBy = actorId;
      dec.decidedAt = now;
      dec.reason = reason.trim();
      dec.updatedAt = now;

      decisionsStore.set(decisionId, dec);

      await auditLogger.log({
        firmId,
        actorId,
        action: "DECISION_REJECTED",
        entityType: "DECISION",
        entityId: decisionId,
        details: { clientId: dec.clientId, subject: dec.subject, reason: dec.reason }
      });

      return res.status(200).json(dec);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createDecisionRouter, getStore, resetStore };
