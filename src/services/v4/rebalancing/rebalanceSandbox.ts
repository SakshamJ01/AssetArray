/**
 * AssetArray 4.0 — Immutable Tax-Aware Rebalancing Sandbox Engine
 * Computes target allocation, drift corridors, candidate trade slips, and tax impact.
 * Input portfolio is NEVER mutated. Zero trade execution or broker connectivity.
 */

import { CanonicalRecord, DriftCorridorConfig, RebalanceCandidate, RebalanceProposalComparison } from "../../../types/v4/computation";
import { evaluateDriftCorridors } from "./driftCorridors";
import { normalizeTaxLotFromCanonical, NormalizedTaxLot } from "../tax/taxLotNormalizer";

export interface RebalanceSandboxInput {
  tenantId: string;
  portfolioId: string;
  holdings: CanonicalRecord[];
  corridors: DriftCorridorConfig[];
  asOf?: string;
}

export function generateRebalanceProposal(input: RebalanceSandboxInput): RebalanceProposalComparison {
  const { tenantId, portfolioId, corridors } = input;
  const asOf = input.asOf || new Date().toISOString();

  // IMMUTABILITY GUARANTEE: Deep clone input records so original array is untouched
  const immutableHoldings: CanonicalRecord[] = JSON.parse(JSON.stringify(input.holdings || []));

  const totalValue = immutableHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);

  // Compute current weights by asset class
  const currentValByClass: Record<string, number> = {};
  immutableHoldings.forEach((h) => {
    const ac = h.assetClass || "Alternatives";
    currentValByClass[ac] = (currentValByClass[ac] || 0) + (h.currentValue || 0);
  });

  const currentWeightsPct: Record<string, number> = {};
  Object.keys(currentValByClass).forEach((ac) => {
    currentWeightsPct[ac] = totalValue > 0 ? (currentValByClass[ac] / totalValue) * 100 : 0;
  });

  // Evaluate drift corridors
  const driftEvaluations = evaluateDriftCorridors(currentWeightsPct, corridors);

  const candidates: RebalanceCandidate[] = [];
  let estimatedTurnoverValue = 0;
  let totalTaxImpact: number | "TAX_IMPACT_UNCERTAIN" = 0;

  // Process holdings for candidates
  immutableHoldings.forEach((h) => {
    const ac = h.assetClass;
    const driftEval = driftEvaluations.find((d) => d.assetClass === ac);
    const taxLot: NormalizedTaxLot = normalizeTaxLotFromCanonical(h);

    let action: RebalanceCandidate["action"] = "NO_ACTION";
    let rationale = "Allocation is within drift corridor tolerance bands.";
    let valueDelta = 0;

    if (driftEval && driftEval.isBreached) {
      if (driftEval.breachDirection === "OVERWEIGHT") {
        action = "SELL";
        const excessWeightPct = driftEval.currentWeightPct - driftEval.targetWeightPct;
        valueDelta = (excessWeightPct / 100) * totalValue * (h.currentValue / (currentValByClass[ac] || 1));
        rationale = `Asset class '${ac}' is overweight by ${driftEval.absoluteDriftPct.toFixed(1)}%. Rebalance recommends trimming position.`;
      } else if (driftEval.breachDirection === "UNDERWEIGHT") {
        action = "BUY";
        const deficitWeightPct = driftEval.targetWeightPct - driftEval.currentWeightPct;
        valueDelta = (deficitWeightPct / 100) * totalValue * (h.currentValue / (currentValByClass[ac] || 1));
        rationale = `Asset class '${ac}' is underweight by ${Math.abs(driftEval.absoluteDriftPct).toFixed(1)}%. Rebalance recommends adding to position.`;
      }
    }

    if (action !== "NO_ACTION") {
      estimatedTurnoverValue += valueDelta;
    }

    // Evaluate Tax Impact safely
    let estimatedTaxImpact: number | "TAX_IMPACT_UNCERTAIN" = 0;
    if (action === "SELL") {
      if (taxLot.taxImpactStatus === "TAX_IMPACT_UNCERTAIN" || taxLot.verificationStatus === "UNVERIFIED") {
        estimatedTaxImpact = "TAX_IMPACT_UNCERTAIN";
        totalTaxImpact = "TAX_IMPACT_UNCERTAIN";
      } else {
        if (taxLot.unrealizedGainLoss > 0) {
          const rate = taxLot.isLongTerm ? 0.125 : 0.20;
          estimatedTaxImpact = parseFloat((taxLot.unrealizedGainLoss * rate).toFixed(2));
          if (typeof totalTaxImpact === "number") {
            totalTaxImpact += estimatedTaxImpact;
          }
        } else {
          estimatedTaxImpact = 0; // Tax loss harvest opportunity
        }
      }
    }

    candidates.push({
      securitySymbol: h.symbol,
      securityName: h.securityName,
      assetClass: h.assetClass,
      action,
      currentWeightPct: totalValue > 0 ? parseFloat(((h.currentValue / totalValue) * 100).toFixed(2)) : 0,
      targetWeightPct: driftEval ? driftEval.targetWeightPct : 0,
      weightDeltaPct: driftEval ? parseFloat(driftEval.absoluteDriftPct.toFixed(2)) : 0,
      estimatedValueDelta: parseFloat(valueDelta.toFixed(2)),
      taxLotsAffectedCount: 1,
      estimatedTaxImpact,
      dataQuality: h.qualityState,
      rationale,
    });
  });

  // Calculate proposed allocation
  const proposedValByClass: Record<string, number> = { ...currentValByClass };
  corridors.forEach((c) => {
    proposedValByClass[c.assetClass] = (c.targetWeightPct / 100) * totalValue;
  });

  const proposedAllocation: Record<string, { weightPct: number; value: number }> = {};
  Object.keys(proposedValByClass).forEach((ac) => {
    proposedAllocation[ac] = {
      weightPct: totalValue > 0 ? parseFloat(((proposedValByClass[ac] / totalValue) * 100).toFixed(2)) : 0,
      value: parseFloat((proposedValByClass[ac] || 0).toFixed(2)),
    };
  });

  const currentAllocation: Record<string, { weightPct: number; value: number }> = {};
  Object.keys(currentValByClass).forEach((ac) => {
    currentAllocation[ac] = {
      weightPct: totalValue > 0 ? parseFloat(((currentValByClass[ac] / totalValue) * 100).toFixed(2)) : 0,
      value: parseFloat((currentValByClass[ac] || 0).toFixed(2)),
    };
  });

  const maxDriftBefore = Math.max(0, ...driftEvaluations.map((d) => Math.abs(d.absoluteDriftPct)));

  return {
    portfolioId,
    tenantId,
    asOf,
    currentAllocation,
    proposedAllocation,
    candidates,
    estimatedTurnoverValue: parseFloat(estimatedTurnoverValue.toFixed(2)),
    estimatedTaxImpactTotal: typeof totalTaxImpact === "number" ? parseFloat(totalTaxImpact.toFixed(2)) : "TAX_IMPACT_UNCERTAIN",
    concentrationChange: {
      topSecurityCurrentWeightPct: candidates.length > 0 ? Math.max(...candidates.map((c) => c.currentWeightPct)) : 0,
      topSecurityProposedWeightPct: candidates.length > 0 ? Math.max(...candidates.map((c) => c.currentWeightPct)) : 0,
    },
    riskChangeSummary: {
      status: "REDUCED_DRIFT",
      maxDriftBeforePct: parseFloat(maxDriftBefore.toFixed(2)),
      maxDriftAfterPct: 0,
    },
    isImmutable: true,
  };
}
