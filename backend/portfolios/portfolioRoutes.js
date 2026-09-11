/**
 * AssetArray 4.0 — Portfolio & Holdings Management Routes
 * Enforces strict tenant isolation on all portfolio and holding mutations.
 */

const express = require("express");
const crypto = require("crypto");
const { PortfolioModel } = require("./portfolioModel");
const { requirePermission, enforceTenantScope } = require("../auth/middleware");
const { PERMISSIONS } = require("../auth/rbac");
const { auditLogger } = require("../audit/auditLogger");

function createPortfolioRouter(dbManager) {
  const router = express.Router();

  // GET /api/v4/portfolios — List portfolios in current firm
  router.get("/", requirePermission(PERMISSIONS.PORTFOLIO_READ), async (req, res) => {
    try {
      const portfoliosCol = dbManager.getCollection("portfolios");
      const { clientId, householdId } = req.query;
      const query = enforceTenantScope(req, {});
      if (clientId) query.clientId = String(clientId);
      if (householdId) query.householdId = String(householdId);

      const portfolios = await portfoliosCol.find(query).toArray();
      res.json({
        ok: true,
        total: portfolios.length,
        portfolios: portfolios.map((p) => PortfolioModel.toPublic(p)),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to list portfolios." });
    }
  });

  // GET /api/v4/portfolios/:id — Read single portfolio
  router.get("/:id", requirePermission(PERMISSIONS.PORTFOLIO_READ), async (req, res) => {
    try {
      const portfoliosCol = dbManager.getCollection("portfolios");
      const query = enforceTenantScope(req, { id: req.params.id });
      const portfolio = await portfoliosCol.findOne(query);
      if (!portfolio) {
        res.status(404).json({ error: "Portfolio not found." });
        return;
      }
      res.json({ ok: true, portfolio: PortfolioModel.toPublic(portfolio) });
    } catch (err) {
      res.status(500).json({ error: "Failed to load portfolio." });
    }
  });

  // POST /api/v4/portfolios — Create or register new portfolio
  router.post("/", requirePermission(PERMISSIONS.PORTFOLIO_WRITE), async (req, res) => {
    try {
      const portfoliosCol = dbManager.getCollection("portfolios");
      const data = req.body || {};

      const newPortfolio = PortfolioModel.sanitize(
        {
          ...data,
          id: data.id || `port_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`,
        },
        req.tenant.firmId
      );

      await portfoliosCol.insertOne(newPortfolio);

      await auditLogger.log({
        firmId: req.tenant.firmId,
        actorId: req.user.id,
        actorUsername: req.user.username,
        actorRole: req.user.role,
        action: "PORTFOLIO_CREATED",
        entityType: "PORTFOLIO",
        entityId: newPortfolio.id,
        afterSnapshot: newPortfolio,
        ipAddress: req.ip,
      });

      res.status(201).json({ ok: true, portfolio: PortfolioModel.toPublic(newPortfolio) });
    } catch (err) {
      res.status(500).json({ error: "Failed to create portfolio." });
    }
  });

  // PUT /api/v4/portfolios/:id/holdings — Update all holdings in portfolio (reconciliation or manual edit)
  router.put("/:id/holdings", requirePermission(PERMISSIONS.PORTFOLIO_WRITE), async (req, res) => {
    try {
      const portfoliosCol = dbManager.getCollection("portfolios");
      const targetId = req.params.id;
      const query = enforceTenantScope(req, { id: targetId });

      const current = await portfoliosCol.findOne(query);
      if (!current) {
        res.status(404).json({ error: "Portfolio not found." });
        return;
      }

      const { holdings = [] } = req.body || {};
      const updated = PortfolioModel.sanitize(
        {
          ...current,
          holdings,
          updatedAt: new Date().toISOString(),
        },
        req.tenant.firmId
      );

      await portfoliosCol.updateOne(query, { $set: updated });

      await auditLogger.log({
        firmId: req.tenant.firmId,
        actorId: req.user.id,
        actorUsername: req.user.username,
        actorRole: req.user.role,
        action: "HOLDINGS_MUTATED",
        entityType: "PORTFOLIO",
        entityId: targetId,
        beforeSnapshot: { holdingsCount: current.holdings?.length, totalValue: current.totalValue },
        afterSnapshot: { holdingsCount: updated.holdings?.length, totalValue: updated.totalValue },
        reason: req.body.reason || "Holdings updated by advisor/ops",
        ipAddress: req.ip,
      });

      res.json({ ok: true, portfolio: PortfolioModel.toPublic(updated) });
    } catch (err) {
      res.status(500).json({ error: "Failed to update portfolio holdings." });
    }
  });

  return router;
}

module.exports = { createPortfolioRouter };
