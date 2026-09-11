/**
 * AssetArray 4.0 — Firm / Tenant Management Routes
 */

const express = require("express");
const { FirmModel } = require("./firmModel");
const { requirePermission } = require("../auth/middleware");
const { PERMISSIONS } = require("../auth/rbac");
const { auditLogger } = require("../audit/auditLogger");

function createFirmRouter(dbManager) {
  const router = express.Router();

  // GET /api/v4/firms/current — Retrieve current authenticated firm profile
  router.get("/current", async (req, res) => {
    try {
      const firmsCol = dbManager.getCollection("firms");
      const firmId = req.tenant.firmId;
      const firm = await firmsCol.findOne({ id: firmId });
      if (!firm) {
        res.status(404).json({ error: "Firm tenant not found." });
        return;
      }
      res.json({ ok: true, firm: FirmModel.toPublic(firm) });
    } catch (err) {
      res.status(500).json({ error: "Failed to load firm profile." });
    }
  });

  // PATCH /api/v4/firms/current — Update firm branding and settings (Admin only)
  router.patch("/current", requirePermission(PERMISSIONS.FIRM_CONFIGURE), async (req, res) => {
    try {
      const firmsCol = dbManager.getCollection("firms");
      const firmId = req.tenant.firmId;
      const currentFirm = await firmsCol.findOne({ id: firmId });
      if (!currentFirm) {
        res.status(404).json({ error: "Firm tenant not found." });
        return;
      }

      const { name, branding, settings, sebiRegistrationNo, riaLicense } = req.body || {};
      const updateData = {
        updatedAt: new Date().toISOString(),
      };
      if (name) updateData.name = String(name).trim();
      if (sebiRegistrationNo) updateData.sebiRegistrationNo = String(sebiRegistrationNo).trim();
      if (riaLicense) updateData.riaLicense = String(riaLicense).trim();
      if (branding) updateData.branding = { ...currentFirm.branding, ...branding };
      if (settings) updateData.settings = { ...currentFirm.settings, ...settings };

      await firmsCol.updateOne({ id: firmId }, { $set: updateData });
      const updated = await firmsCol.findOne({ id: firmId });

      await auditLogger.log({
        firmId,
        actorId: req.user.id,
        actorUsername: req.user.username,
        actorRole: req.user.role,
        action: "FIRM_CONFIGURED",
        entityType: "FIRM",
        entityId: firmId,
        beforeSnapshot: currentFirm,
        afterSnapshot: updated,
        ipAddress: req.ip,
      });

      res.json({ ok: true, firm: FirmModel.toPublic(updated) });
    } catch (err) {
      res.status(500).json({ error: "Failed to update firm settings." });
    }
  });

  return router;
}

module.exports = { createFirmRouter };
