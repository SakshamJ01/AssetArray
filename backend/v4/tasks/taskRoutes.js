/**
 * AssetArray 4.0 — Backend Tasks API Routes
 * Endpoints:
 * GET /api/v4/tasks
 * POST /api/v4/tasks
 * GET /api/v4/tasks/:id
 * PATCH /api/v4/tasks/:id
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { auditLogger } = require("../../audit/auditLogger");

// In-memory persistent store per tenant
const tasksStore = new Map();

function getStore() {
  return tasksStore;
}

function resetStore() {
  tasksStore.clear();
}

function createTaskRouter() {
  const router = express.Router();

  // GET /api/v4/tasks
  router.get("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const { clientId, householdId, portfolioId, status, priority, source } = req.query;

      const results = [];
      for (const task of tasksStore.values()) {
        if (task.tenantId !== firmId) continue;
        if (clientId && task.clientId !== clientId) continue;
        if (householdId && task.householdId !== householdId) continue;
        if (portfolioId && task.portfolioId !== portfolioId) continue;
        if (status && task.status !== status) continue;
        if (priority && task.priority !== priority) continue;
        if (source && task.source !== source) continue;
        results.push(task);
      }

      // Sort by creation date descending
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json(results);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/tasks
  router.post("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || req.body.createdBy || "system";
      const actorRole = req.user?.role || "ADVISOR";

      const {
        clientId,
        householdId,
        portfolioId,
        title,
        description,
        type,
        priority = "MEDIUM",
        ownerUserId = actorId,
        dueAt,
        source = "MANUAL",
        sourceEntityId,
        evidence
      } = req.body;

      if (!clientId || typeof clientId !== "string") {
        return res.status(400).json({ error: "clientId is required" });
      }
      if (!title || typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({ error: "title is required" });
      }

      const taskId = req.body.taskId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const now = new Date().toISOString();

      const task = {
        taskId,
        tenantId: firmId,
        clientId,
        householdId,
        portfolioId,
        title: title.trim(),
        description: description || "",
        type: type || "ADVISOR_TASK",
        priority,
        status: "OPEN",
        ownerUserId,
        createdBy: actorId,
        dueAt,
        source,
        sourceEntityId,
        evidence,
        createdAt: now,
        updatedAt: now
      };

      tasksStore.set(taskId, task);

      await auditLogger.log({
        firmId,
        actorId,
        action: "TASK_CREATED",
        entityType: "TASK",
        entityId: taskId,
        details: { clientId, title: task.title, priority: task.priority, source: task.source }
      });

      return res.status(201).json(task);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/tasks/:id
  router.get("/:id", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const taskId = req.params.id;

      const task = tasksStore.get(taskId);
      if (!task || task.tenantId !== firmId) {
        return res.status(404).json({ error: `Task ${taskId} not found` });
      }

      return res.status(200).json(task);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // PATCH /api/v4/tasks/:id
  router.patch("/:id", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || "system";
      const actorRole = req.user?.role || "ADVISOR";
      const taskId = req.params.id;

      const task = tasksStore.get(taskId);
      if (!task || task.tenantId !== firmId) {
        return res.status(404).json({ error: `Task ${taskId} not found` });
      }

      const { status, ownerUserId, completionNote, snoozedUntil, blockReason, cancellationReason, title, description, priority } = req.body;
      const now = new Date().toISOString();

      if (status && status !== task.status) {
        // State machine check
        const validTransitions = {
          OPEN: ["IN_PROGRESS", "SNOOZED", "BLOCKED", "CANCELLED", "DONE"],
          IN_PROGRESS: ["BLOCKED", "SNOOZED", "CANCELLED", "DONE", "OPEN"],
          SNOOZED: ["OPEN", "IN_PROGRESS", "CANCELLED"],
          BLOCKED: ["OPEN", "IN_PROGRESS", "CANCELLED"],
          DONE: ["OPEN"],
          CANCELLED: ["OPEN"]
        };

        const allowed = validTransitions[task.status] || [];
        if (!allowed.includes(status)) {
          return res.status(400).json({
            error: `Illegal task state transition from ${task.status} to ${status}`
          });
        }

        task.status = status;
        if (status === "DONE") {
          task.completedAt = now;
          task.completionNote = completionNote || task.completionNote;
        } else if (status === "SNOOZED") {
          if (!snoozedUntil) {
            return res.status(400).json({ error: "snoozedUntil is required when snoozing a task" });
          }
          task.snoozedUntil = snoozedUntil;
        } else if (status === "BLOCKED") {
          task.blockReason = blockReason || "Blocked";
        } else if (status === "CANCELLED") {
          task.cancellationReason = cancellationReason || "Cancelled";
        }

        await auditLogger.log({
          firmId,
          actorId,
          action: status === "DONE" ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
          entityType: "TASK",
          entityId: taskId,
          details: { priorStatus: task.status, newStatus: status, note: completionNote }
        });
      }

      if (ownerUserId && ownerUserId !== task.ownerUserId) {
        const priorOwner = task.ownerUserId;
        task.ownerUserId = ownerUserId;
        await auditLogger.log({
          firmId,
          actorId,
          action: "TASK_ASSIGNED",
          entityType: "TASK",
          entityId: taskId,
          details: { priorOwner, newOwner: ownerUserId }
        });
      }

      if (title) task.title = title.trim();
      if (description !== undefined) task.description = description;
      if (priority) task.priority = priority;
      task.updatedAt = now;

      tasksStore.set(taskId, task);
      return res.status(200).json(task);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createTaskRouter, getStore, resetStore };
