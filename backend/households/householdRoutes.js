/**
 * AssetArray 4.0 — Household Management Routes
 * Supports family office multi-member aggregation within firm tenant.
 */

const express = require("express");
const crypto = require("crypto");
const { HouseholdModel } = require("./householdModel");
const { requirePermission, enforceTenantScope } = require("../auth/middleware");
const { PERMISSIONS } = require("../auth/rbac");
const { auditLogger } = require("../audit/auditLogger");

function createHouseholdRouter(dbManager) {
  const router = express.Router();

  // GET /api/v4/households — List households in firm
  router.get("/", requirePermission(PERMISSIONS.HOUSEHOLD_READ), async (req, res) => {
    try {
      const householdsCol = dbManager.getCollection("households");
      const query = enforceTenantScope(req, {});
      const households = await householdsCol.find(query).toArray();
      res.json({
        ok: true,
        total: households.length,
        households: households.map((h) => HouseholdModel.toPublic(h)),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to list households." });
    }
  });

  // GET /api/v4/households/:id — Read single household
  router.get("/:id", requirePermission(PERMISSIONS.HOUSEHOLD_READ), async (req, res) => {
    try {
      const householdsCol = dbManager.getCollection("households");
      const query = enforceTenantScope(req, { id: req.params.id });
      const household = await householdsCol.findOne(query);
      if (!household) {
        res.status(404).json({ error: "Household not found." });
        return;
      }
      res.json({ ok: true, household: HouseholdModel.toPublic(household) });
    } catch (err) {
      res.status(500).json({ error: "Failed to load household." });
    }
  });

  // POST /api/v4/households — Create household
  router.post("/", requirePermission(PERMISSIONS.HOUSEHOLD_WRITE), async (req, res) => {
    try {
      const householdsCol = dbManager.getCollection("households");
      const data = req.body || {};
      if (!data.name) {
        res.status(400).json({ error: "Household name is required." });
        return;
      }

      const newHousehold = HouseholdModel.sanitize(
        {
          ...data,
          id: data.id || `hh_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`,
        },
        req.tenant.firmId
      );

      await householdsCol.insertOne(newHousehold);

      await auditLogger.log({
        firmId: req.tenant.firmId,
        actorId: req.user.id,
        actorUsername: req.user.username,
        actorRole: req.user.role,
        action: "HOUSEHOLD_CREATED",
        entityType: "HOUSEHOLD",
        entityId: newHousehold.id,
        afterSnapshot: newHousehold,
        ipAddress: req.ip,
      });

      res.status(201).json({ ok: true, household: HouseholdModel.toPublic(newHousehold) });
    } catch (err) {
      res.status(500).json({ error: "Failed to create household." });
    }
  });

  // PATCH /api/v4/households/:id — Update household
  router.patch("/:id", requirePermission(PERMISSIONS.HOUSEHOLD_WRITE), async (req, res) => {
    try {
      const householdsCol = dbManager.getCollection("households");
      const targetId = req.params.id;
      const query = enforceTenantScope(req, { id: targetId });

      const current = await householdsCol.findOne(query);
      if (!current) {
        res.status(404).json({ error: "Household not found." });
        return;
      }

      const updates = { ...req.body, updatedAt: new Date().toISOString() };
      delete updates.id;
      delete updates.firmId;

      await householdsCol.updateOne(query, { $set: updates });
      const updated = await householdsCol.findOne(query);

      await auditLogger.log({
        firmId: req.tenant.firmId,
        actorId: req.user.id,
        actorUsername: req.user.username,
        actorRole: req.user.role,
        action: "HOUSEHOLD_UPDATED",
        entityType: "HOUSEHOLD",
        entityId: targetId,
        beforeSnapshot: current,
        afterSnapshot: updated,
        ipAddress: req.ip,
      });

      res.json({ ok: true, household: HouseholdModel.toPublic(updated) });
    } catch (err) {
      res.status(500).json({ error: "Failed to update household." });
    }
  });

  return router;
}

module.exports = { createHouseholdRouter };
