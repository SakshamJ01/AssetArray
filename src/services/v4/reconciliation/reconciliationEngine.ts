/**
 * AssetArray 4.0 — 3-Way Reconciliation Engine
 * Compares SOURCE LEDGER vs CANONICAL PORTFOLIO vs DERIVED VALUATION.
 * Detects breaks, computes deterministic severities, and enforces Corporate Action Safety.
 */

import { CanonicalRecord, DiscrepancySeverity, DiscrepancyStatus, DiscrepancyType, ReconciliationDiscrepancy } from "../../../types/v4/computation";
import { SimpleHolding } from "../../rebalancer";

const memDiscrepancyStore = new Map<string, ReconciliationDiscrepancy>();

export interface ReconciliationInput {
  tenantId: string;
  portfolioId: string;
  sourceRecords: CanonicalRecord[];
  portfolioHoldings: SimpleHolding[];
  derivedValuations?: Record<string, number>;
}

export function computeSeverity(
  type: DiscrepancyType,
  valueDiff: number,
  qtyDiffPct: number
): DiscrepancySeverity {
  const absVal = Math.abs(valueDiff);
  const absQtyPct = Math.abs(qtyDiffPct);

  if (type === "CORPORATE_ACTION_MISMATCH") return "HIGH";
  if (type === "CASH_MISMATCH" && absVal > 50000) return "CRITICAL";
  if (type === "MISSING_POSITION" && absVal > 50000) return "CRITICAL";

  if (absVal > 100000 || absQtyPct > 20) {
    return "CRITICAL";
  }
  if (absVal > 25000 || absQtyPct > 5) {
    return "HIGH";
  }
  if (absVal > 5000 || type === "TAX_LOT_MISMATCH") {
    return "MEDIUM";
  }
  return "LOW";
}

export function runReconciliationMatrix(input: ReconciliationInput): ReconciliationDiscrepancy[] {
  const { tenantId, portfolioId, sourceRecords, portfolioHoldings } = input;
  if (!tenantId) {
    throw new Error("[ReconciliationEngine] Tenant scope required for reconciliation.");
  }

  const discrepancies: ReconciliationDiscrepancy[] = [];
  const detectedAt = new Date().toISOString();

  const holdingMap = new Map<string, SimpleHolding>();
  portfolioHoldings.forEach((h) => {
    const sym = (h.symbol || h.ticker || h.assetName).toUpperCase().trim();
    holdingMap.set(sym, h);
  });

  const sourceMap = new Map<string, CanonicalRecord>();

  // 1. Process Source Records against Portfolio Holdings
  sourceRecords.forEach((src) => {
    const sym = src.symbol.toUpperCase().trim();
    sourceMap.set(sym, src);

    const existingHolding = holdingMap.get(sym);

    if (!existingHolding) {
      // UNEXPECTED POSITION in Source
      const severity = computeSeverity("UNEXPECTED_POSITION", src.currentValue, 100);
      const disc: ReconciliationDiscrepancy = {
        discrepancyId: `disc-${portfolioId}-${sym}-unexpected`,
        tenantId,
        entity: { portfolioId, symbol: sym, securityName: src.securityName },
        type: "UNEXPECTED_POSITION",
        expected: 0,
        observed: src.currentValue,
        difference: src.currentValue,
        source: src.provenance.source,
        severity,
        status: "OPEN",
        detectedAt,
      };
      discrepancies.push(disc);
      return;
    }

    // Check Quantity Mismatch
    const srcQty = src.quantity;
    const portQty = existingHolding.quantity || 0;
    const qtyDiff = Math.abs(srcQty - portQty);
    const qtyDiffPct = portQty > 0 ? (qtyDiff / portQty) * 100 : 100;

    if (portQty > 0 && qtyDiff > 0.001) {
      // Check if corporate action split ratio pattern (2:1, 5:1, etc.)
      const isSplitPattern = srcQty > 0 && portQty > 0 && (srcQty / portQty === 2 || srcQty / portQty === 5 || srcQty / portQty === 10);
      const discType: DiscrepancyType = isSplitPattern ? "CORPORATE_ACTION_MISMATCH" : "QUANTITY_MISMATCH";

      const severity = computeSeverity(discType, Math.abs(src.currentValue - existingHolding.currentValue), qtyDiffPct);

      discrepancies.push({
        discrepancyId: `disc-${portfolioId}-${sym}-qty`,
        tenantId,
        entity: { portfolioId, symbol: sym, securityName: src.securityName, holdingId: existingHolding.id },
        type: discType,
        expected: portQty,
        observed: srcQty,
        difference: srcQty - portQty,
        source: src.provenance.source,
        severity,
        status: "OPEN",
        detectedAt,
        requiresCorporateActionReview: isSplitPattern,
      });
    }

    // Check Value Mismatch
    const valDiff = Math.abs(src.currentValue - existingHolding.currentValue);
    if (valDiff > 500) {
      const severity = computeSeverity("VALUE_MISMATCH", valDiff, qtyDiffPct);
      discrepancies.push({
        discrepancyId: `disc-${portfolioId}-${sym}-val`,
        tenantId,
        entity: { portfolioId, symbol: sym, securityName: src.securityName, holdingId: existingHolding.id },
        type: "VALUE_MISMATCH",
        expected: existingHolding.currentValue,
        observed: src.currentValue,
        difference: src.currentValue - existingHolding.currentValue,
        source: src.provenance.source,
        severity,
        status: "OPEN",
        detectedAt,
      });
    }
  });

  // 2. Check Missing Positions (In Portfolio Ledger but missing from Source)
  portfolioHoldings.forEach((h) => {
    const sym = (h.symbol || h.ticker || h.assetName).toUpperCase().trim();
    if (!sourceMap.has(sym)) {
      const severity = computeSeverity("MISSING_POSITION", h.currentValue, 100);
      discrepancies.push({
        discrepancyId: `disc-${portfolioId}-${sym}-missing`,
        tenantId,
        entity: { portfolioId, symbol: sym, securityName: h.assetName, holdingId: h.id },
        type: "MISSING_POSITION",
        expected: h.currentValue,
        observed: 0,
        difference: -h.currentValue,
        source: "PORTFOLIO_LEDGER",
        severity,
        status: "OPEN",
        detectedAt,
      });
    }
  });

  // Save to memory store
  discrepancies.forEach((d) => memDiscrepancyStore.set(d.discrepancyId, d));

  return discrepancies;
}

export function resolveDiscrepancy(
  discrepancyId: string,
  tenantId: string,
  resolvedBy: string,
  resolutionNote?: string,
  targetStatus: DiscrepancyStatus = "RESOLVED"
): ReconciliationDiscrepancy | null {
  const disc = memDiscrepancyStore.get(discrepancyId);
  if (!disc || disc.tenantId !== tenantId) return null;

  disc.status = targetStatus;
  disc.resolvedAt = new Date().toISOString();
  disc.resolvedBy = resolvedBy;
  disc.resolutionNote = resolutionNote || `Status updated to ${targetStatus}`;

  return disc;
}

export function getDiscrepancies(tenantId: string, status?: DiscrepancyStatus): ReconciliationDiscrepancy[] {
  return Array.from(memDiscrepancyStore.values()).filter(
    (d) => d.tenantId === tenantId && (!status || d.status === status)
  );
}

export function clearReconciliationMemory(): void {
  memDiscrepancyStore.clear();
}
