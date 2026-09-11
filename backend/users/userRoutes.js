/**
 * AssetArray 4.0 — User Management & Team Provisioning Routes
 */

const express = require("express");
const crypto = require("crypto");
const { UserModel } = require("./userModel");
const { requirePermission, enforceTenantScope } = require("../auth/middleware");
const { PERMISSIONS, normalizeRole } = require("../auth/rbac");
const { newPasswordSalt, hashPassword } = require("../auth/crypto");
const { auditLogger } = require("../audit/auditLogger");

function createUserRouter(dbManager, tokenSecret) {
  const router = express.Router();

  // GET /api/v4/users — List all users belonging to the current firm tenant
  router.get("/", requirePermission(PERMISSIONS.USERS_MANAGE), async (req, res) => {
    try {
      const usersCol = dbManager.getCollection("users");
      const query = enforceTenantScope(req, {});
      const users = await usersCol.find(query).toArray();
      res.json({
        ok: true,
        total: users.length,
        users: users.map((u) => UserModel.toPublic(u)),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to list firm users." });
    }
  });

  // POST /api/v4/users — Create/provision a new user in the firm
  router.post("/", requirePermission(PERMISSIONS.USERS_MANAGE), async (req, res) => {
    try {
      const usersCol = dbManager.getCollection("users");
      const { username, password, role, fullName, email } = req.body || {};

      if (!username || !password) {
        res.status(400).json({ error: "username and password are required." });
        return;
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const existing = await usersCol.findOne({ username: cleanUsername });
      if (existing) {
        res.status(409).json({ error: `Username '${cleanUsername}' is already taken.` });
        return;
      }

      const salt = newPasswordSalt();
      const pwdHash = hashPassword(password, salt, tokenSecret);

      const newUser = UserModel.sanitize(
        {
          id: `usr_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`,
          firmId: req.tenant.firmId,
          username: cleanUsername,
          fullName: fullName || cleanUsername,
          email: email || null,
          role: normalizeRole(role),
          passwordSalt: salt,
          passwordHash: pwdHash,
          active: true,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
        req.tenant.firmId
      );

      await usersCol.insertOne(newUser);

      await auditLogger.log({
        firmId: req.tenant.firmId,
        actorId: req.user.id,
        actorUsername: req.user.username,
        actorRole: req.user.role,
        action: "USER_PROVISIONED",
        entityType: "USER",
        entityId: newUser.id,
        afterSnapshot: UserModel.toPublic(newUser),
        ipAddress: req.ip,
      });

      res.status(201).json({ ok: true, user: UserModel.toPublic(newUser) });
    } catch (err) {
      res.status(500).json({ error: "Failed to provision user." });
    }
  });

  // PATCH /api/v4/users/:id — Update role or active status of a user
  router.patch("/:id", requirePermission(PERMISSIONS.USERS_MANAGE), async (req, res) => {
    try {
      const usersCol = dbManager.getCollection("users");
      const targetId = req.params.id;
      const query = enforceTenantScope(req, { id: targetId });

      const targetUser = await usersCol.findOne(query);
      if (!targetUser) {
        res.status(404).json({ error: "User not found in current firm." });
        return;
      }

      const { role, active, status, fullName } = req.body || {};
      const updateData = { updatedAt: new Date().toISOString() };

      if (role) updateData.role = normalizeRole(role);
      if (active !== undefined) updateData.active = Boolean(active);
      if (status) updateData.status = status;
      if (fullName) updateData.fullName = String(fullName).trim();

      await usersCol.updateOne(query, { $set: updateData });
      const updated = await usersCol.findOne(query);

      await auditLogger.log({
        firmId: req.tenant.firmId,
        actorId: req.user.id,
        actorUsername: req.user.username,
        actorRole: req.user.role,
        action: "USER_UPDATED",
        entityType: "USER",
        entityId: targetId,
        beforeSnapshot: UserModel.toPublic(targetUser),
        afterSnapshot: UserModel.toPublic(updated),
        ipAddress: req.ip,
      });

      res.json({ ok: true, user: UserModel.toPublic(updated) });
    } catch (err) {
      res.status(500).json({ error: "Failed to update user." });
    }
  });

  return router;
}

module.exports = { createUserRouter };
