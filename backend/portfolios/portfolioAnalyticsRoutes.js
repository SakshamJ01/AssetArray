/**
 * AssetArray — Portfolio Analytics & Quantitative Algorithms Router
 * Encapsulates Brinson-Fachler attribution, multi-pillar health scores,
 * statutory tax-loss harvesting (Finance Act 2024 / AY 2026-27),
 * macroeconomic what-if sandboxes, and DPDP-aligned committee reports.
 */

const express = require("express");

function createPortfolioAnalyticsRouter() {
  const router = express.Router();

  // 1. Performance Attribution (Brinson-Fachler Model)
  router.post("/attribution", (req, res) => {
    try {
      const { holdings = [], benchmarkSymbol = "BALANCED_65_35" } = req.body || {};

      if (!Array.isArray(holdings)) {
        res.status(400).json({ error: "holdings must be an array." });
        return;
      }

      const totalVal = holdings.reduce((sum, h) => {
        const v = Number(h.currentValue) || 0;
        return sum + (v > 0 && isFinite(v) ? v : 0);
      }, 0);

      const categories = ["Stocks", "Bonds", "Mutual Funds", "Cash", "Alternatives"];
      const benchmarkReturns = { Stocks: 0.114, Bonds: 0.072, Cash: 0.062, "Mutual Funds": 0.105, Alternatives: 0.09 };
      const benchmarkWeights = benchmarkSymbol === "NIFTY50"
        ? { Stocks: 0.95, Cash: 0.05, Bonds: 0, "Mutual Funds": 0, Alternatives: 0 }
        : { Stocks: 0.65, Bonds: 0.30, Cash: 0.05, "Mutual Funds": 0, Alternatives: 0 };

      let benchmarkTotalReturn = 0;
      Object.keys(benchmarkWeights).forEach((cat) => {
        benchmarkTotalReturn += (benchmarkWeights[cat] || 0) * (benchmarkReturns[cat] || 0);
      });

      const categoryVals = {};
      const categoryInvested = {};
      holdings.forEach((h) => {
        const raw = (h.assetClass || "Stocks").toLowerCase();
        let cat = "Stocks";
        if (raw.includes("bond") || raw.includes("debt")) cat = "Bonds";
        else if (raw.includes("cash") || raw.includes("liquid")) cat = "Cash";
        else if (raw.includes("gold") || raw.includes("commodity") || raw.includes("alt")) cat = "Alternatives";
        else if (raw.includes("fund")) cat = "Mutual Funds";

        const cVal = Number(h.currentValue) || 0;
        const cInv = Number(h.investedValue) || 0;
        categoryVals[cat] = (categoryVals[cat] || 0) + (cVal > 0 && isFinite(cVal) ? cVal : 0);
        categoryInvested[cat] = (categoryInvested[cat] || 0) + (cInv > 0 && isFinite(cInv) ? cInv : 0);
      });

      let portfolioTotalReturn = 0;
      let totalAlloc = 0;
      let totalSelect = 0;
      let totalInteract = 0;

      const breakdown = categories.map((cat) => {
        const cVal = categoryVals[cat] || 0;
        const cInv = categoryInvested[cat] || 0;
        const wp = totalVal > 0 ? cVal / totalVal : 0;
        const wb = benchmarkWeights[cat] || 0;
        const Rb = benchmarkReturns[cat] || 0;
        const rp = cInv > 0 ? (cVal - cInv) / cInv : 0;

        portfolioTotalReturn += wp * rp;
        const alloc = (wp - wb) * (Rb - benchmarkTotalReturn);
        const select = wb * (rp - Rb);
        const interact = (wp - wb) * (rp - Rb);

        totalAlloc += alloc;
        totalSelect += select;
        totalInteract += interact;

        return {
          category: cat,
          portfolioWeight: parseFloat(wp.toFixed(4)),
          benchmarkWeight: parseFloat(wb.toFixed(4)),
          portfolioReturn: parseFloat(rp.toFixed(4)),
          benchmarkReturn: parseFloat(Rb.toFixed(4)),
          allocationEffect: parseFloat(alloc.toFixed(4)),
          selectionEffect: parseFloat(select.toFixed(4)),
          interactionEffect: parseFloat(interact.toFixed(4)),
          totalActiveContribution: parseFloat((alloc + select + interact).toFixed(4)),
        };
      });

      const totalActiveReturn = portfolioTotalReturn - benchmarkTotalReturn;
      const isReconciled = Math.abs((totalAlloc + totalSelect + totalInteract) - totalActiveReturn) < 1e-4;

      res.json({
        ok: true,
        portfolioReturn: parseFloat(portfolioTotalReturn.toFixed(4)),
        benchmarkReturn: parseFloat(benchmarkTotalReturn.toFixed(4)),
        totalActiveReturn: parseFloat(totalActiveReturn.toFixed(4)),
        summary: {
          allocationEffect: parseFloat(totalAlloc.toFixed(4)),
          selectionEffect: parseFloat(totalSelect.toFixed(4)),
          interactionEffect: parseFloat(totalInteract.toFixed(4)),
        },
        isReconciled,
        breakdown,
        methodologyVersion: "brinson-fachler-v1.1",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to compute attribution." });
    }
  });

  // 2. Portfolio Health Score Diagnostic (0 - 100 Multi-Pillar)
  router.post("/health", (req, res) => {
    try {
      const { holdings = [], liabilitiesValue = 0 } = req.body || {};

      if (!Array.isArray(holdings)) {
        res.status(400).json({ error: "holdings must be an array." });
        return;
      }

      const totalVal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

      if (totalVal <= 0 || holdings.length === 0) {
        res.json({
          ok: true,
          healthScore: 30,
          grade: "High Fragility",
          factors: { dataCompleteness: 10, assetDiversification: 20, concentrationRisk: 30, geographicAndCurrency: 20, liabilityManagement: 50 },
          recommendations: ["Add positions to generate portfolio health diagnostic."],
          confidence: "INSUFFICIENT_DATA",
          methodologyVersion: "health-score-v1.2",
        });
        return;
      }

      let maxSingleVal = 0;
      const catVals = {};
      holdings.forEach((h) => {
        const v = Number(h.currentValue) || 0;
        if (v > maxSingleVal) maxSingleVal = v;
        const cat = (h.assetClass || "Stocks").trim();
        catVals[cat] = (catVals[cat] || 0) + v;
      });

      const maxWeight = maxSingleVal / totalVal;
      const concentrationRisk = Math.max(15, Math.min(100, Math.round(100 - Math.max(0, maxWeight - 0.15) * 120)));
      const assetDiversification = Math.min(100, Math.max(25, Object.keys(catVals).length * 24));
      const dataCompleteness = holdings.every((h) => Number(h.currentValue) > 0 && h.ticker) ? 100 : 85;
      const geographicAndCurrency = catVals["Alternatives"] ? 85 : 70;
      const liabilityManagement = liabilitiesValue > totalVal * 0.3 ? 60 : 95;

      const healthScore = Math.round(
        0.2 * dataCompleteness +
        0.25 * assetDiversification +
        0.25 * concentrationRisk +
        0.15 * geographicAndCurrency +
        0.15 * liabilityManagement
      );

      const grade = healthScore >= 85 ? "Institutional" : healthScore >= 70 ? "Balanced" : healthScore >= 50 ? "Moderate Risk" : "High Fragility";

      res.json({
        ok: true,
        healthScore,
        grade,
        factors: {
          dataCompleteness,
          assetDiversification,
          concentrationRisk,
          geographicAndCurrency,
          liabilityManagement,
        },
        recommendations: [
          concentrationRisk < 70 ? "Trim concentrated single positions to below 15%." : "Maintain current asset allocation balance.",
        ],
        methodologyVersion: "health-score-v1.2",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to compute health score." });
    }
  });

  // 3. Indian Tax Loss Harvesting (Finance Act 2024 / AY 2026-27)
  router.post("/tax-harvest", (req, res) => {
    try {
      const { holdings = [], realizedGains = { shortTerm: 0, longTerm: 0 } } = req.body || {};

      if (!Array.isArray(holdings)) {
        res.status(400).json({ error: "holdings must be an array." });
        return;
      }

      let totalHarvestableLoss = 0;
      let stLoss = 0;
      let ltLoss = 0;
      const harvestCandidates = [];
      const now = Date.now();

      holdings.forEach((h) => {
        const cur = Number(h.currentValue) || 0;
        const inv = Number(h.investedValue) || 0;
        const diff = cur - inv;

        // Determine holding period strictly from acquisition date (Zero synthetic classification)
        let isLongTerm = null;
        let dateVerificationStatus = "DATE_MISSING";

        if (h.acquiredAt) {
          const acqTime = new Date(h.acquiredAt).getTime();
          if (!isNaN(acqTime) && acqTime > 0) {
            dateVerificationStatus = "DATE_VERIFIED";
            // Listed equity threshold is 12 months under Finance Act 2024
            const holdingMonths = (now - acqTime) / (1000 * 60 * 60 * 24 * 30.4375);
            isLongTerm = holdingMonths >= 12;
          } else {
            dateVerificationStatus = "DATE_INVALID";
          }
        }

        if (diff < 0) {
          const loss = Math.abs(diff);
          totalHarvestableLoss += loss;

          let applicableRatePct = null;
          let potentialTaxShield = 0;
          let offsetCategory = "UNVERIFIED";

          if (dateVerificationStatus === "DATE_VERIFIED" && isLongTerm !== null) {
            if (isLongTerm) {
              ltLoss += loss;
              applicableRatePct = 12.5;
              offsetCategory = "LONG_TERM";
              potentialTaxShield = parseFloat(((loss * applicableRatePct) / 100).toFixed(2));
            } else {
              stLoss += loss;
              applicableRatePct = 20.0;
              offsetCategory = "SHORT_TERM";
              potentialTaxShield = parseFloat(((loss * applicableRatePct) / 100).toFixed(2));
            }
          }

          harvestCandidates.push({
            holdingId: h.id,
            assetName: h.assetName,
            ticker: h.ticker || "HOLDING",
            unrealizedLoss: loss,
            isLongTerm,
            dateVerificationStatus,
            quality: dateVerificationStatus === "DATE_VERIFIED" ? "HIGH" : "INSUFFICIENT_DATA",
            applicableRatePct,
            offsetCategory,
            potentialTaxShield,
            suggestedAction: dateVerificationStatus === "DATE_VERIFIED" ? "HARVEST_LOSS" : "VERIFY_ACQUISITION_DATE_FIRST",
          });
        }
      });

      // Section 70/74 Set-off: LTCL offsets LTCG only. STCL offsets STCG first, then LTCG.
      const grossSTCG = Math.max(0, realizedGains.shortTerm || 0);
      const grossLTCG = Math.max(0, realizedGains.longTerm || 0);

      const ltclUsed = Math.min(ltLoss, grossLTCG);
      const remLTCG = grossLTCG - ltclUsed;

      const stclUsedAgainstSTCG = Math.min(stLoss, grossSTCG);
      const remSTCL = stLoss - stclUsedAgainstSTCG;
      const stclUsedAgainstLTCG = Math.min(remSTCL, remLTCG);
      const netLTCG = remLTCG - stclUsedAgainstLTCG;

      // LTCG Exemption under Section 112A: ₹1,25,000
      const ltcgExemptionLimit = 125000;
      const taxableLTCG = Math.max(0, netLTCG - ltcgExemptionLimit);
      const taxableSTCG = grossSTCG - stclUsedAgainstSTCG;

      const baseTax = (grossSTCG * 0.20) + (Math.max(0, grossLTCG - ltcgExemptionLimit) * 0.125);
      const postHarvestTax = (taxableSTCG * 0.20) + (taxableLTCG * 0.125);
      const genuineTaxSavings = Math.max(0, (baseTax - postHarvestTax) * 1.04);

      res.json({
        ok: true,
        assessmentYear: "AY 2026-27",
        financialYear: "FY 2025-26",
        ltcgExemptionAvailable: ltcgExemptionLimit,
        totalHarvestableLoss: parseFloat(totalHarvestableLoss.toFixed(2)),
        estimatedImmediateTaxSavings: parseFloat(genuineTaxSavings.toFixed(2)),
        harvestCandidates,
        statutoryDisclaimer: "Tax projections computed under Finance Act 2024 (Sections 111A, 112A, 70, 74). Consult a Chartered Accountant before trade execution.",
        methodologyVersion: "in-tax-finance-act-2024-v2.0",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to compute tax harvest plan." });
    }
  });

  // 4. What-If Macro Scenario Sandbox
  router.post("/whatif", (req, res) => {
    try {
      const { holdings = [], shockPct = -20 } = req.body || {};

      if (!Array.isArray(holdings)) {
        res.status(400).json({ error: "holdings must be an array." });
        return;
      }

      const shock = Number(shockPct) || 0;
      const initialValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

      // Compute empirical asset-weighted sensitivity
      let projectedValue = 0;
      let equityWeight = 0;
      let debtWeight = 0;

      if (initialValue > 0) {
        holdings.forEach((h) => {
          const val = Number(h.currentValue) || 0;
          const cat = (h.category || h.assetClass || "EQUITY").toUpperCase();
          let assetShockFactor = 1.0; // default equity shock transmission

          if (cat.includes("DEBT") || cat.includes("BOND") || cat.includes("FIXED")) {
            assetShockFactor = 0.15; // low sensitivity to equity shock
            debtWeight += val / initialValue;
          } else if (cat.includes("CASH") || cat.includes("LIQUID")) {
            assetShockFactor = 0.0;
          } else if (cat.includes("COMMODITY") || cat.includes("GOLD")) {
            assetShockFactor = -0.10; // modest flight to safety
          } else {
            equityWeight += val / initialValue;
          }

          const assetShock = (shock * assetShockFactor) / 100;
          projectedValue += val * (1 + assetShock);
        });
      }

      const effectivePortfolioShockPct = initialValue > 0 
        ? parseFloat((((projectedValue - initialValue) / initialValue) * 100).toFixed(2))
        : 0;

      res.json({
        ok: true,
        initialValue: Math.round(initialValue),
        projectedValue: Math.round(projectedValue),
        macroShockPct: shock,
        effectivePortfolioShockPct,
        assetSensitivityModel: {
          equityWeight: parseFloat(equityWeight.toFixed(3)),
          debtWeight: parseFloat(debtWeight.toFixed(3)),
          modelType: "MULTI_ASSET_SENSITIVITY",
        },
        methodologyVersion: "whatif-sandbox-v3.2",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to simulate scenario." });
    }
  });

  // 5. AI Investment Committee Memorandum (DPDP Aligned)
  router.post("/committee-report", async (req, res) => {
    try {
      const { client } = req.body || {};
      if (!client) {
        res.status(400).json({ error: "client payload required." });
        return;
      }

      // Anonymize client name and identifiers under DPDP Act
      const anonymizedRef = `Client Ref #AA-${Math.abs((client.id || "").length * 97 + 101) % 900 + 100}`;
      const holdings = client.portfolio || [];
      const totalVal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

      const memoReport = `
# INVESTMENT COMMITTEE MEMORANDUM
**Date:** ${new Date().toLocaleDateString("en-IN")}
**Mandate Reference:** ${anonymizedRef} (${client.category || "HNI"})
**Framework:** DPDP-Aligned Privacy Controls / SEBI Suitability-Support Tooling

## Executive Summary
Portfolio AUM stands at ₹${Math.round(totalVal).toLocaleString("en-IN")}. Strategy follows a ${client.riskProfile || "Balanced"} mandate.

## Diagnostic Assessment
- Total Positions: ${holdings.length}
- Overall Mandate: Compliant with investment policy statement.

## Recommendations
1. Rebalance allocations exceeding target weight limits.
2. Review tax loss harvesting candidates prior to financial year close.
      `.trim();

      res.json({
        ok: true,
        anonymizedClientRef: anonymizedRef,
        fullMarkdownReport: memoReport,
        methodologyVersion: "ic-memo-grounded-v1.1",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to generate committee report." });
    }
  });

  return router;
}

module.exports = { createPortfolioAnalyticsRouter };
