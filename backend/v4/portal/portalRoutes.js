/**
 * AssetArray 4.0 — Backend Client / Investor Portal API Routes
 * Endpoints:
 * GET /api/v4/portal/me
 * GET /api/v4/portal/portfolio
 * GET /api/v4/portal/goals
 * GET /api/v4/portal/reports
 * GET /api/v4/portal/documents
 * GET /api/v4/portal/action-items
 * POST /api/v4/portal/action-items/:id/respond
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { auditLogger } = require("../../audit/auditLogger");
const { getStore: getReportsStore } = require("../reporting/reportingRoutes");

// In-memory portal action items & documents store
const portalActionsStore = new Map();
const portalDocsStore = new Map();

function resetPortalStores() {
  portalActionsStore.clear();
  portalDocsStore.clear();
}

function createPortalRouter() {
  const router = express.Router();

  // GET /api/v4/portal/me
  router.get("/me", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const clientId = req.query.clientId || req.user?.clientId || "client_101";

      const profile = {
        clientId,
        tenantId: firmId,
        name: "Client Investor Profile",
        riskProfile: "GROWTH",
        assignedAdvisorName: "Wealth Desk Advisory Team",
        lastLoginAt: new Date().toISOString()
      };

      await auditLogger.log({
        firmId,
        actorId: req.user?.id || clientId,
        action: "PORTAL_LOGIN",
        entityType: "PORTAL_SESSION",
        entityId: clientId,
        details: { clientId }
      });

      return res.status(200).json(profile);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/portal/portfolio
  router.get("/portfolio", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const clientId = req.query.clientId || req.user?.clientId || "client_101";

      const portfolio = {
        totalAUM: 50000000,
        currency: "INR",
        asOfDate: new Date().toISOString().split("T")[0],
        assetAllocation: [
          { assetClass: "EQUITY", percentage: 65.0, amount: 32500000 },
          { assetClass: "DEBT", percentage: 25.0, amount: 12500000 },
          { assetClass: "CASH", percentage: 10.0, amount: 5000000 }
        ],
        topHoldings: [
          { symbol: "RELIANCE", name: "Reliance Industries Ltd", weightPct: 20.0, currentVal: 10000000 },
          { symbol: "HDFCBANK", name: "HDFC Bank Ltd", weightPct: 15.0, currentVal: 7500000 }
        ],
        performanceSummary: [
          { period: "1Y", returnPct: 14.8 },
          { period: "3Y", returnPct: 12.2 }
        ]
      };

      return res.status(200).json(portfolio);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/portal/goals
  router.get("/goals", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const clientId = req.query.clientId || req.user?.clientId || "client_101";

      const goals = [
        {
          goalId: "goal_retire_1",
          title: "Retirement Independence 2040",
          targetAmount: 100000000,
          currentAmount: 50000000,
          targetDate: "2040-03-31",
          onTrack: true,
          probabilityPct: 88
        }
      ];

      return res.status(200).json(goals);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/portal/reports (Only APPROVED and PUBLISHED client reports)
  router.get("/reports", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const clientId = req.query.clientId || req.user?.clientId || "client_101";

      const reportsStore = getReportsStore();
      const clientSafeReports = [];

      for (const rep of reportsStore.values()) {
        if (
          rep.tenantId === firmId &&
          rep.clientId === clientId &&
          (rep.status === "APPROVED" || rep.status === "PUBLISHED") &&
          (rep.reportType === "CLIENT_REVIEW_REPORT" || rep.reportType === "MEETING_FOLLOW_UP_PACK")
        ) {
          clientSafeReports.push({
            reportId: rep.reportId,
            title: rep.title,
            reportType: rep.reportType,
            asOf: rep.asOf,
            publishedAt: rep.publishedAt || rep.updatedAt,
            sections: rep.sections,
            disclosures: rep.fiduciaryDisclosures
          });
        }
      }

      await auditLogger.log({
        firmId,
        actorId: req.user?.id || clientId,
        action: "PORTAL_REPORT_VIEW",
        entityType: "PORTAL_REPORTS",
        entityId: clientId,
        details: { count: clientSafeReports.length }
      });

      return res.status(200).json(clientSafeReports);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/portal/documents
  router.get("/documents", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const clientId = req.query.clientId || req.user?.clientId || "client_101";

      const docs = [
        {
          documentId: "doc_q2_2026_stmt",
          tenantId: firmId,
          clientId,
          name: "Quarterly Wealth Statement Q2 2026.pdf",
          category: "STATEMENT",
          date: "2026-06-30",
          status: "AVAILABLE",
          downloadUrl: `/api/v4/portal/documents/doc_q2_2026_stmt/download`
        }
      ];

      await auditLogger.log({
        firmId,
        actorId: req.user?.id || clientId,
        action: "PORTAL_DOCUMENT_VIEW",
        entityType: "PORTAL_DOCUMENTS",
        entityId: clientId,
        details: { count: docs.length }
      });

      return res.status(200).json(docs);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/portal/action-items
  router.get("/action-items", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const clientId = req.query.clientId || req.user?.clientId || "client_101";

      const items = [
        {
          actionId: "act_item_1",
          tenantId: firmId,
          clientId,
          title: "Confirm Annual Review Meeting Attendance",
          description: "Please confirm your availability for our scheduled review call on Tuesday.",
          type: "CONFIRM_MEETING_ITEM",
          status: "PENDING",
          createdAt: new Date().toISOString()
        }
      ];

      return res.status(200).json(items);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/portal/action-items/:id/respond
  router.post("/action-items/:id/respond", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actionId = req.params.id;
      const { clientResponse, status = "COMPLETED" } = req.body;

      const now = new Date().toISOString();
      const updatedAction = {
        actionId,
        tenantId: firmId,
        status,
        clientResponse: clientResponse || "Confirmed",
        completedAt: now
      };

      await auditLogger.log({
        firmId,
        actorId: req.user?.id || "portal_user",
        action: "PORTAL_ACTION_SUBMITTED",
        entityType: "PORTAL_ACTION_ITEM",
        entityId: actionId,
        details: { status, response: clientResponse }
      });

      return res.status(200).json(updatedAction);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createPortalRouter, resetPortalStores };
