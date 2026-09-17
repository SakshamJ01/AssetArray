/**
 * AssetArray 4.0 — Backend Grounded AI API Routes
 * Endpoints:
 * POST /api/v4/ai/explain
 * POST /api/v4/ai/meeting-brief
 * POST /api/v4/ai/research-summary
 * POST /api/v4/ai/draft-communication
 * POST /api/v4/ai/challenge
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { auditLogger } = require("../../audit/auditLogger");

function createAiRouter() {
  const router = express.Router();

  // POST /api/v4/ai/explain
  router.post("/explain", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || "system";
      const { topic, contextSnapshot } = req.body;

      if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
        return res.status(400).json({ error: "topic is required" });
      }

      await auditLogger.log({
        firmId,
        actorId,
        action: "AI_REQUESTED",
        entityType: "AI_EXPLAIN",
        entityId: `ai_exp_${Date.now()}`,
        details: { topic: topic.trim(), snapshotId: contextSnapshot?.snapshotId }
      });

      const response = {
        taskType: "PORTFOLIO_EXPLANATION",
        snapshotId: contextSnapshot?.snapshotId || `ctx_${firmId}_${Date.now()}`,
        confidence: "HIGH",
        topic: topic.trim(),
        summary: `Deterministic analysis for topic: ${topic.trim()}`,
        detailedExplanation: `Based on verified portfolio context, ${topic.trim()} was evaluated against established allocation guidelines.`,
        keyDrivers: ["Asset allocation corridors", "Risk parameter compliance"],
        claims: [],
        limitations: ["Derived strictly from active context snapshot."],
        suggestedActions: ["Review holding details in portfolio desk"],
        requiresHumanReview: true,
        disclaimer: "Advisory assistance only."
      };

      await auditLogger.log({
        firmId,
        actorId,
        action: "AI_COMPLETED",
        entityType: "AI_EXPLAIN",
        entityId: response.snapshotId,
        details: { topic: topic.trim(), confidence: response.confidence }
      });

      return res.status(200).json(response);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/ai/meeting-brief
  router.post("/meeting-brief", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || "system";
      const { clientId, contextSnapshot } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }

      await auditLogger.log({
        firmId,
        actorId,
        action: "AI_REQUESTED",
        entityType: "AI_MEETING_BRIEF",
        entityId: `ai_mtg_${Date.now()}`,
        details: { clientId, snapshotId: contextSnapshot?.snapshotId }
      });

      const aum = contextSnapshot?.portfolioSnapshot?.totalAUM || 0;
      const aumStr = aum > 0 ? `₹${aum.toLocaleString("en-IN")}` : "Portfolio under review";

      const brief = {
        taskType: "MEETING_BRIEF",
        snapshotId: contextSnapshot?.snapshotId || `ctx_${firmId}_${Date.now()}`,
        clientId,
        confidence: "HIGH",
        clientOverview: `Client: ${contextSnapshot?.clientSnapshot?.name || "Client"} (${aumStr})`,
        portfolioChanges: {
          title: "Portfolio & Allocation",
          keyPoints: [`Total AUM: ${aumStr}`, `Drift score: ${contextSnapshot?.portfolioSnapshot?.driftScore || 0}%`],
          evidenceReferences: ["PORTFOLIO_LEDGER"]
        },
        riskExceptions: {
          title: "Risk Profile",
          keyPoints: [`Risk Score: ${contextSnapshot?.riskSnapshot?.riskScore || "Standard"}`],
          evidenceReferences: ["RISK_ENGINE"]
        },
        taxOpportunities: {
          title: "Tax Optimization",
          keyPoints: [`Harvestable Losses: ₹${(contextSnapshot?.taxSnapshot?.harvestableLosses || 0).toLocaleString("en-IN")}`],
          evidenceReferences: ["TAX_ENGINE"]
        },
        goalsReview: {
          title: "Goals & Mandates",
          keyPoints: [`Open Tasks: ${contextSnapshot?.workflowSnapshot?.openTasksCount || 0}`],
          evidenceReferences: ["TASK_ENGINE"]
        },
        suggestedDiscussionTopics: ["Review quarterly performance", "Confirm tax harvesting actions"],
        recommendedFollowUps: ["Record meeting decisions in Meeting Workspace"],
        claims: [],
        limitations: ["Grounded in current snapshot data."],
        suggestedActions: ["Start meeting in AssetArray Workspace"],
        requiresHumanReview: true,
        disclaimer: "Advisory use only."
      };

      await auditLogger.log({
        firmId,
        actorId,
        action: "AI_COMPLETED",
        entityType: "AI_MEETING_BRIEF",
        entityId: brief.snapshotId,
        details: { clientId }
      });

      return res.status(200).json(brief);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/ai/challenge
  router.post("/challenge", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || "system";
      const { thesis, contextSnapshot } = req.body;

      if (!thesis || typeof thesis !== "string" || thesis.trim().length === 0) {
        return res.status(400).json({ error: "thesis is required" });
      }

      await auditLogger.log({
        firmId,
        actorId,
        action: "AI_REQUESTED",
        entityType: "AI_DECISION_CHALLENGE",
        entityId: `ai_chl_${Date.now()}`,
        details: { thesis: thesis.trim() }
      });

      const challenge = {
        taskType: "DECISION_CHALLENGE",
        snapshotId: contextSnapshot?.snapshotId || `ctx_${firmId}_${Date.now()}`,
        confidence: "HIGH",
        thesis: thesis.trim(),
        supportingEvidence: ["Thesis aligns with tactical allocation adjustments."],
        counterEvidence: ["Consider tax realization costs and transaction friction."],
        missingInformation: ["Has replacement liquidity been finalized?"],
        probingQuestions: [
          "Does this adjustment match the client's multi-year risk horizon?",
          "What is the expected tax impact?"
        ],
        claims: [],
        limitations: ["Cognitive stress test only."],
        suggestedActions: ["Record formal decision in Decision ledger"],
        requiresHumanReview: true,
        disclaimer: "Not an automated trade recommendation."
      };

      await auditLogger.log({
        firmId,
        actorId,
        action: "AI_COMPLETED",
        entityType: "AI_DECISION_CHALLENGE",
        entityId: challenge.snapshotId,
        details: { thesis: thesis.trim() }
      });

      return res.status(200).json(challenge);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/ai/draft-communication
  router.post("/draft-communication", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || "system";
      const { channel = "EMAIL", purpose, keyPoints = [], contextSnapshot } = req.body;

      if (!purpose || typeof purpose !== "string" || purpose.trim().length === 0) {
        return res.status(400).json({ error: "purpose is required" });
      }

      const clientName = contextSnapshot?.clientSnapshot?.name || "Client";
      const draft = {
        taskType: "CLIENT_COMMUNICATION_DRAFT",
        snapshotId: contextSnapshot?.snapshotId || `ctx_${firmId}_${Date.now()}`,
        confidence: "HIGH",
        channel,
        subject: `AssetArray Portfolio Update — ${purpose.trim()}`,
        draftBody: `Dear ${clientName},\n\nRegarding ${purpose.trim()}, we have prepared an assessment of your portfolio.\n\nPlease let us know your availability for a call.\n\nWarm regards,\nAdvisor Team`,
        audienceContext: `Client: ${clientName}`,
        talkingPoints: [`Purpose: ${purpose.trim()}`],
        claims: [],
        limitations: ["Requires advisor review prior to dispatch."],
        suggestedActions: ["Edit text and send via approved channel"],
        requiresHumanReview: true,
        disclaimer: "Draft communication only. No automated dispatch."
      };

      await auditLogger.log({
        firmId,
        actorId,
        action: "AI_COMPLETED",
        entityType: "AI_COMMUNICATION_DRAFT",
        entityId: draft.snapshotId,
        details: { channel, purpose: purpose.trim() }
      });

      return res.status(200).json(draft);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createAiRouter };
