/**
 * AssetArray 4.0 — Client Management Routes
 * Enforces strict tenant isolation on all client reads and mutations.
 */

const express = require("express");
const crypto = require("crypto");
const { ClientModel } = require("./clientModel");
const { requirePermission, enforceTenantScope } = require("../auth/middleware");
const { PERMISSIONS } = require("../auth/rbac");
const { auditLogger } = require("../audit/auditLogger");

function createClientRouter(dbManager) {
  const router = express.Router();

  // GET /api/v4/clients — List clients in current firm
  router.get("/", requirePermission(PERMISSIONS.CLIENT_READ), async (req, res) => {
    try {
      const clientsCol = dbManager.getCollection("clients");
      const query = enforceTenantScope(req, {});
      const clients = await clientsCol.find(query).toArray();
      res.json({
        ok: true,
        total: clients.length,
        clients: clients.map((c) => ClientModel.toPublic(c)),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to load clients." });
    }
  });

  // GET /api/v4/clients/:id — Read single client
  router.get("/:id", requirePermission(PERMISSIONS.CLIENT_READ), async (req, res) => {
    try {
      const clientsCol = dbManager.getCollection("clients");
      const query = enforceTenantScope(req, { id: req.params.id });
      const client = await clientsCol.findOne(query);
      if (!client) {
        res.status(404).json({ error: "Client not found." });
        return;
      }
      res.json({ ok: true, client: ClientModel.toPublic(client) });
    } catch (err) {
      res.status(500).json({ error: "Failed to load client." });
    }
  });

  // POST /api/v4/clients — Create new client in current firm
  router.post("/", requirePermission(PERMISSIONS.CLIENT_WRITE), async (req, res) => {
    try {
      const clientsCol = dbManager.getCollection("clients");
      const clientData = req.body || {};
      if (!clientData.name) {
        res.status(400).json({ error: "Client name is required." });
        return;
      }

      const newClient = ClientModel.sanitize(
        {
          ...clientData,
          id: clientData.id || `client_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`,
        },
        req.tenant.firmId
      );

      await clientsCol.insertOne(newClient);

      await auditLogger.log({
        firmId: req.tenant.firmId,
        actorId: req.user.id,
        actorUsername: req.user.username,
        actorRole: req.user.role,
        action: "CLIENT_CREATED",
        entityType: "CLIENT",
        entityId: newClient.id,
        afterSnapshot: newClient,
        ipAddress: req.ip,
      });

      res.status(201).json({ ok: true, client: ClientModel.toPublic(newClient) });
    } catch (err) {
      res.status(500).json({ error: "Failed to create client." });
    }
  });

  // PATCH /api/v4/clients/:id — Update client details
  router.patch("/:id", requirePermission(PERMISSIONS.CLIENT_WRITE), async (req, res) => {
    try {
      const clientsCol = dbManager.getCollection("clients");
      const targetId = req.params.id;
      const query = enforceTenantScope(req, { id: targetId });

      const current = await clientsCol.findOne(query);
      if (!current) {
        res.status(404).json({ error: "Client not found." });
        return;
      }

      const updates = { ...req.body, updatedAt: new Date().toISOString() };
      delete updates.id;
      delete updates.firmId; // Never allow mutating firmId

      await clientsCol.updateOne(query, { $set: updates });
      const updated = await clientsCol.findOne(query);

      await auditLogger.log({
        firmId: req.tenant.firmId,
        actorId: req.user.id,
        actorUsername: req.user.username,
        actorRole: req.user.role,
        action: "CLIENT_UPDATED",
        entityType: "CLIENT",
        entityId: targetId,
        beforeSnapshot: current,
        afterSnapshot: updated,
        ipAddress: req.ip,
      });

      res.json({ ok: true, client: ClientModel.toPublic(updated) });
    } catch (err) {
      res.status(500).json({ error: "Failed to update client." });
    }
  });

  return router;
}

module.exports = { createClientRouter };
