/**
 * AssetArray 4.0 — Backend Meeting Workspace API Routes
 * Endpoints:
 * GET /api/v4/meetings
 * POST /api/v4/meetings
 * GET /api/v4/meetings/:id
 * PATCH /api/v4/meetings/:id
 * POST /api/v4/meetings/:id/start
 * POST /api/v4/meetings/:id/complete
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { auditLogger } = require("../../audit/auditLogger");
const { getStore: getTasksStore } = require("../tasks/taskRoutes");

const meetingsStore = new Map();

function getStore() {
  return meetingsStore;
}

function resetStore() {
  meetingsStore.clear();
}

function createMeetingRouter() {
  const router = express.Router();

  // GET /api/v4/meetings
  router.get("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const { clientId, status } = req.query;

      const results = [];
      for (const m of meetingsStore.values()) {
        if (m.tenantId !== firmId) continue;
        if (clientId && m.clientId !== clientId) continue;
        if (status && m.status !== status) continue;
        results.push(m);
      }

      results.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
      return res.status(200).json(results);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/meetings
  router.post("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || req.body.createdBy || "system";

      const { clientId, householdId, title, scheduledAt, participants = [], agenda = [], preMeetingSnapshot } = req.body;

      if (!clientId) return res.status(400).json({ error: "clientId is required" });
      if (!title || title.trim().length === 0) return res.status(400).json({ error: "title is required" });
      if (!scheduledAt) return res.status(400).json({ error: "scheduledAt timestamp is required" });

      const meetingId = req.body.meetingId || `mtg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const now = new Date().toISOString();

      const meeting = {
        meetingId,
        tenantId: firmId,
        clientId,
        householdId,
        title: title.trim(),
        status: "SCHEDULED",
        participants: participants.length > 0 ? participants : [actorId],
        scheduledAt,
        agenda: agenda.map((a, i) => ({ id: `ag_${i + 1}`, title: a.title || a, completed: false })),
        preMeetingSnapshot: preMeetingSnapshot || null,
        notes: [],
        decisions: [],
        tasks: [],
        createdAt: now,
        updatedAt: now
      };

      meetingsStore.set(meetingId, meeting);

      await auditLogger.log({
        firmId,
        actorId,
        action: "MEETING_SCHEDULED",
        entityType: "MEETING",
        entityId: meetingId,
        details: { clientId, title: meeting.title, scheduledAt }
      });

      return res.status(201).json(meeting);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/meetings/:id
  router.get("/:id", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const meetingId = req.params.id;

      const meeting = meetingsStore.get(meetingId);
      if (!meeting || meeting.tenantId !== firmId) {
        return res.status(404).json({ error: `Meeting ${meetingId} not found` });
      }

      return res.status(200).json(meeting);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // PATCH /api/v4/meetings/:id (add notes, check agenda)
  router.patch("/:id", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const meetingId = req.params.id;
      const actorId = req.user?.id || "system";

      const meeting = meetingsStore.get(meetingId);
      if (!meeting || meeting.tenantId !== firmId) {
        return res.status(404).json({ error: `Meeting ${meetingId} not found` });
      }

      if (meeting.status === "COMPLETED" || meeting.status === "CANCELLED") {
        return res.status(400).json({ error: `Cannot modify a ${meeting.status} meeting record` });
      }

      const { note, agenda, title, participants } = req.body;
      const now = new Date().toISOString();

      if (note && note.trim().length > 0) {
        meeting.notes.push({
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          authorId: actorId,
          content: note.trim(),
          createdAt: now
        });
      }

      if (agenda && Array.isArray(agenda)) {
        meeting.agenda = agenda;
      }

      if (title) meeting.title = title.trim();
      if (participants && Array.isArray(participants)) meeting.participants = participants;

      meeting.updatedAt = now;
      meetingsStore.set(meetingId, meeting);

      return res.status(200).json(meeting);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/meetings/:id/start
  router.post("/:id/start", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || "system";
      const meetingId = req.params.id;

      const meeting = meetingsStore.get(meetingId);
      if (!meeting || meeting.tenantId !== firmId) {
        return res.status(404).json({ error: `Meeting ${meetingId} not found` });
      }

      if (meeting.status === "COMPLETED") {
        return res.status(400).json({ error: "Cannot start an already completed meeting" });
      }

      const now = new Date().toISOString();
      meeting.status = "IN_PROGRESS";
      meeting.startedAt = meeting.startedAt || now;
      meeting.updatedAt = now;

      meetingsStore.set(meetingId, meeting);

      await auditLogger.log({
        firmId,
        actorId,
        action: "MEETING_STARTED",
        entityType: "MEETING",
        entityId: meetingId,
        details: { clientId: meeting.clientId, title: meeting.title }
      });

      return res.status(200).json(meeting);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/meetings/:id/complete
  router.post("/:id/complete", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || "system";
      const meetingId = req.params.id;
      const { followUpTasks = [] } = req.body;

      const meeting = meetingsStore.get(meetingId);
      if (!meeting || meeting.tenantId !== firmId) {
        return res.status(404).json({ error: `Meeting ${meetingId} not found` });
      }

      if (meeting.status === "COMPLETED") {
        return res.status(409).json({ error: "Meeting is already completed (duplicate completion prevented)" });
      }

      const now = new Date().toISOString();
      meeting.status = "COMPLETED";
      meeting.endedAt = now;
      meeting.updatedAt = now;

      // Create follow-up tasks in tasksStore
      const tasksStore = getTasksStore();
      const createdTaskIds = [];

      for (let i = 0; i < followUpTasks.length; i++) {
        const item = followUpTasks[i];
        const taskId = `task_fu_${meetingId}_${i + 1}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (item.dueDays || 3));

        const task = {
          taskId,
          tenantId: firmId,
          clientId: meeting.clientId,
          householdId: meeting.householdId,
          title: item.title,
          description: item.description || `Follow-up from meeting: ${meeting.title}`,
          type: "MEETING_FOLLOW_UP",
          priority: item.priority || "MEDIUM",
          status: "OPEN",
          ownerUserId: actorId,
          createdBy: actorId,
          dueAt: dueDate.toISOString(),
          source: "MEETING_FOLLOW_UP",
          sourceEntityId: meetingId,
          evidence: {
            sourceType: "MEETING_FOLLOW_UP",
            sourceId: meetingId,
            details: { meetingTitle: meeting.title }
          },
          createdAt: now,
          updatedAt: now
        };

        tasksStore.set(taskId, task);
        createdTaskIds.push(taskId);

        await auditLogger.log({
          firmId,
          actorId,
          action: "TASK_CREATED",
          entityType: "TASK",
          entityId: taskId,
          details: { clientId: meeting.clientId, source: "MEETING_FOLLOW_UP", meetingId }
        });
      }

      meeting.tasks = [...(meeting.tasks || []), ...createdTaskIds];
      meetingsStore.set(meetingId, meeting);

      await auditLogger.log({
        firmId,
        actorId,
        action: "MEETING_COMPLETED",
        entityType: "MEETING",
        entityId: meetingId,
        details: { clientId: meeting.clientId, followUpTasksCount: createdTaskIds.length }
      });

      return res.status(200).json({ meeting, followUpTasksCreated: createdTaskIds });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createMeetingRouter, getStore, resetStore };
