/**
 * AssetArray 4.0 — Backend Reporting API Routes
 * Endpoints:
 * GET /api/v4/reports
 * POST /api/v4/reports
 * GET /api/v4/reports/:id
 * POST /api/v4/reports/:id/review
 * POST /api/v4/reports/:id/approve
 * POST /api/v4/reports/:id/publish
 * POST /api/v4/reports/:id/share
 * GET /api/v4/reports/share/:token
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { auditLogger } = require("../../audit/auditLogger");

const reportsStore = new Map();
const sharesStore = new Map();

function getStore() {
  return reportsStore;
}

function resetStore() {
  reportsStore.clear();
  sharesStore.clear();
}

function createReportingRouter() {
  const router = express.Router();

  // GET /api/v4/reports
  router.get("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const { clientId, reportType, status } = req.query;

      const results = [];
      for (const rep of reportsStore.values()) {
        if (rep.tenantId !== firmId) continue;
        if (clientId && rep.clientId !== clientId) continue;
        if (reportType && rep.reportType !== reportType) continue;
        if (status && rep.status !== status) continue;
        results.push(rep);
      }

      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json(results);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/reports
  router.post("/", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || req.body.createdBy || "system";

      const {
        clientId,
        householdId,
        portfolioId,
        reportType,
        title,
        currency = "INR",
        sections = [],
        fiduciaryDisclosures = []
      } = req.body;

      if (!clientId) return res.status(400).json({ error: "clientId is required" });
      if (!reportType) return res.status(400).json({ error: "reportType is required" });

      const reportId = req.body.reportId || `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const now = new Date().toISOString();

      const report = {
        reportId,
        tenantId: firmId,
        clientId,
        householdId,
        portfolioId,
        reportType,
        title: title || `${reportType.replace(/_/g, " ")} — Client ${clientId}`,
        status: "GENERATED",
        currency,
        dataSnapshotVersion: `snap_${Date.now()}`,
        methodologyVersion: "v4.0.0-gips-aligned",
        templateVersion: "reportTemplate.v4.1",
        asOf: now,
        createdBy: actorId,
        createdAt: now,
        updatedAt: now,
        sections,
        fiduciaryDisclosures: fiduciaryDisclosures.length > 0 ? fiduciaryDisclosures : [
          "Performance calculations are GIPS-aligned on a time-weighted rate of return basis.",
          "Past performance is no guarantee of future returns."
        ],
        aiNarrativeIncluded: !!req.body.aiNarrativeIncluded,
        isImmutable: false
      };

      reportsStore.set(reportId, report);

      await auditLogger.log({
        firmId,
        actorId,
        action: "REPORT_CREATED",
        entityType: "REPORT",
        entityId: reportId,
        details: { clientId, reportType: report.reportType, title: report.title }
      });

      return res.status(201).json(report);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/reports/:id
  router.get("/:id", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const reportId = req.params.id;

      const report = reportsStore.get(reportId);
      if (!report || report.tenantId !== firmId) {
        return res.status(404).json({ error: `Report ${reportId} not found` });
      }

      return res.status(200).json(report);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/reports/:id/approve
  router.post("/:id/approve", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || req.body.actorId || "system";
      const actorRole = req.user?.role || req.body.actorRole || "ADVISOR";
      const reportId = req.params.id;

      const report = reportsStore.get(reportId);
      if (!report || report.tenantId !== firmId) {
        return res.status(404).json({ error: `Report ${reportId} not found` });
      }

      if (!["ADVISOR", "ADMIN", "COMPLIANCE"].includes(actorRole)) {
        return res.status(403).json({ error: `Role ${actorRole} is not authorized to approve reports` });
      }

      const now = new Date().toISOString();
      report.status = "APPROVED";
      report.approvedBy = actorId;
      report.approvedAt = now;
      report.updatedAt = now;
      report.isImmutable = true;

      reportsStore.set(reportId, report);

      await auditLogger.log({
        firmId,
        actorId,
        action: "REPORT_APPROVED",
        entityType: "REPORT",
        entityId: reportId,
        details: { clientId: report.clientId, approvedBy: actorId }
      });

      return res.status(200).json(report);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/reports/:id/publish
  router.post("/:id/publish", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const actorId = req.user?.id || req.body.actorId || "system";
      const reportId = req.params.id;

      const report = reportsStore.get(reportId);
      if (!report || report.tenantId !== firmId) {
        return res.status(404).json({ error: `Report ${reportId} not found` });
      }

      if (report.status !== "APPROVED") {
        return res.status(400).json({ error: "Report must be in APPROVED status before publishing to client portal" });
      }

      const now = new Date().toISOString();
      report.status = "PUBLISHED";
      report.publishedAt = now;
      report.updatedAt = now;

      reportsStore.set(reportId, report);

      await auditLogger.log({
        firmId,
        actorId,
        action: "REPORT_PUBLISHED",
        entityType: "REPORT",
        entityId: reportId,
        details: { clientId: report.clientId, publishedAt: now }
      });

      return res.status(200).json(report);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/v4/reports/:id/share
  router.post("/:id/share", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const reportId = req.params.id;
      const { expiresInHours = 72 } = req.body;

      const report = reportsStore.get(reportId);
      if (!report || report.tenantId !== firmId) {
        return res.status(404).json({ error: `Report ${reportId} not found` });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + expiresInHours * 3600 * 1000).toISOString();
      const token = `shr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const shareRecord = {
        token,
        tenantId: firmId,
        reportId,
        clientId: report.clientId,
        createdAt: now.toISOString(),
        expiresAt,
        isRevoked: false,
        accessCount: 0
      };

      sharesStore.set(token, shareRecord);

      await auditLogger.log({
        firmId,
        actorId: req.user?.id || "system",
        action: "REPORT_SHARED",
        entityType: "REPORT",
        entityId: reportId,
        details: { token, expiresAt }
      });

      return res.status(201).json(shareRecord);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  });

  // GET /api/v4/reports/share/:token (Public secure link validation)
  router.get("/share/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const shareRecord = sharesStore.get(token);

      if (!shareRecord || shareRecord.isRevoked) {
        return res.status(404).json({ error: "Share link is invalid or has been revoked" });
      }

      if (new Date().getTime() > new Date(shareRecord.expiresAt).getTime()) {
        return res.status(410).json({ error: "Share link has expired" });
      }

      const report = reportsStore.get(shareRecord.reportId);
      if (!report || report.tenantId !== shareRecord.tenantId) {
        return res.status(404).json({ error: "Report associated with share link not found" });
      }

      shareRecord.accessCount += 1;
      shareRecord.lastAccessedAt = new Date().toISOString();
      sharesStore.set(token, shareRecord);

      return res.status(200).json(report);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createReportingRouter, getStore, resetStore };
