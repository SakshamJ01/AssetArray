/**
 * AssetArray 4.0 — Backend Rebalancing API Routes
 * POST /api/v4/rebalance/proposals
 */

const express = require("express");
const { enforceTenantScope } = require("../../auth/middleware");
const { auditLogger } = require("../../audit/auditLogger");

function createRebalancingRouter() {
  const router = express.Router();

  // POST /api/v4/rebalance/proposals
  router.post("/proposals", async (req, res) => {
    try {
      const scope = enforceTenantScope(req, {});
      const firmId = scope.firmId;
      const { portfolioId, holdings, corridors } = req.body;

      if (!portfolioId) {
        return res.status(400).json({ error: "portfolioId is required." });
      }

      // Generate immutable proposal representation
      const proposal = {
        proposalId: `prop-${Date.now()}`,
        portfolioId,
        firmId,
        asOf: new Date().toISOString(),
        currentAllocation: req.body.currentAllocation || {},
        proposedAllocation: req.body.proposedAllocation || {},
        candidates: req.body.candidates || [],
        estimatedTurnoverValue: req.body.estimatedTurnoverValue || 0,
        estimatedTaxImpactTotal: req.body.estimatedTaxImpactTotal || "TAX_IMPACT_UNCERTAIN",
        isImmutable: true,
      };

      await auditLogger.log({
        firmId,
        actorId: req.user?.id || "system",
        action: "REBALANCE_PROPOSAL_CREATED",
        entityType: "REBALANCE_PROPOSAL",
        entityId: proposal.proposalId,
        details: { portfolioId, candidateCount: proposal.candidates.length },
      });

      return res.status(201).json(proposal);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createRebalancingRouter };
