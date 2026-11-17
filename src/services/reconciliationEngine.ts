import { PortfolioHolding, HoldingDiffItem, ReconciliationReport, DiffType, AssetClass } from "../types/wealth";
import { SimpleHolding } from "./rebalancer";

/**
 * Normalizes ticker symbols for cross-broker alignment (e.g., "NSE:RELIANCE" -> "RELIANCE").
 */
export function normalizeTicker(sym: string): string {
  if (!sym) return "";
  let clean = sym.trim().toUpperCase();
  if (clean.startsWith("NSE:") || clean.startsWith("BSE:")) {
    clean = clean.split(":")[1];
  }
  return clean;
}

/**
 * Canonical asset class normalizer matching AssetArray core 5-asset hierarchy.
 */
export function canonicalAssetClass(raw?: string): AssetClass {
  if (!raw) return "Stocks";
  const lower = raw.toLowerCase().trim();
  if (lower.includes("stock") || lower.includes("equit")) return "Stocks";
  if (lower.includes("bond") || lower.includes("debt") || lower.includes("fixed")) return "Bonds";
  if (lower.includes("mutual") || lower.includes("fund")) return "Mutual Funds";
  if (lower.includes("cash") || lower.includes("liquid")) return "Cash";
  return "Alternatives";
}

/**
 * Deterministic pseudo-signature generator for reconciliation audit trail.
 */
function generateAuditSignature(clientId: string, totalDiscrepancy: number, count: number): string {
  const seed = `${clientId}-${totalDiscrepancy.toFixed(2)}-${count}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `AA-REC-${hex.toUpperCase()}`;
}

/**
 * Generates an itemized diff between active portfolio holdings and newly ingested statement holdings.
 */
export function generateReconciliationDiff(
  existingHoldings: PortfolioHolding[],
  statementHoldings: SimpleHolding[],
  clientId: string,
  statementSource = "Broker Statement"
): ReconciliationReport {
  const existingMap = new Map<string, PortfolioHolding>();
  existingHoldings.forEach((h) => {
    const key = normalizeTicker(h.ticker || h.assetName);
    if (key) existingMap.set(key, h);
  });

  const statementMap = new Map<string, SimpleHolding>();
  statementHoldings.forEach((sh) => {
    const key = normalizeTicker(sh.symbol || sh.ticker || sh.assetName);
    if (key) statementMap.set(key, sh);
  });

  const items: HoldingDiffItem[] = [];
  const processedKeys = new Set<string>();

  let totalExistingValue = 0;
  let totalStatementValue = 0;
  let totalDiscrepancyValue = 0;

  // 1. Evaluate positions present in statement (New or Modified or Unchanged)
  statementMap.forEach((sh, key) => {
    processedKeys.add(key);
    const statementQty = Number(sh.quantity) || 0;
    const statementVal = Number(sh.currentValue) || 0;
    totalStatementValue += statementVal;

    const existing = existingMap.get(key);

    if (!existing) {
      // NEW position
      const deltaQty = statementQty;
      const deltaVal = statementVal;
      totalDiscrepancyValue += Math.abs(deltaVal);

      items.push({
        ticker: key,
        assetName: sh.assetName || key,
        assetClass: sh.assetClass || "Equities",
        existingQuantity: 0,
        statementQuantity: statementQty,
        deltaQuantity: deltaQty,
        existingValue: 0,
        statementValue: statementVal,
        deltaValue: deltaVal,
        diffType: "new",
      });
    } else {
      // Position exists in both: compare quantity & valuation
      const existingQty = parseFloat(existing.quantity) || 0;
      const existingVal = parseFloat(existing.currentValue) || 0;
      totalExistingValue += existingVal;

      const deltaQty = statementQty - existingQty;
      const deltaVal = statementVal - existingVal;

      const hasQtyDiff = Math.abs(deltaQty) > 0.001;
      const hasValDiff = Math.abs(deltaVal) > 1.0;

      let diffType: DiffType = "unchanged";
      if (hasQtyDiff || hasValDiff) {
        diffType = "modified";
        totalDiscrepancyValue += Math.abs(deltaVal);
      }

      items.push({
        ticker: key,
        assetName: existing.assetName || sh.assetName || key,
        assetClass: existing.assetClass || sh.assetClass || "Equities",
        existingQuantity: existingQty,
        statementQuantity: statementQty,
        deltaQuantity: deltaQty,
        existingValue: existingVal,
        statementValue: statementVal,
        deltaValue: deltaVal,
        diffType,
      });
    }
  });

  // 2. Evaluate positions present in portfolio but missing from statement (Removed / Liquidated)
  existingMap.forEach((h, key) => {
    if (!processedKeys.has(key)) {
      const existingQty = parseFloat(h.quantity) || 0;
      const existingVal = parseFloat(h.currentValue) || 0;
      totalExistingValue += existingVal;

      const deltaQty = -existingQty;
      const deltaVal = -existingVal;
      totalDiscrepancyValue += Math.abs(existingVal);

      items.push({
        ticker: key,
        assetName: h.assetName || key,
        assetClass: h.assetClass || "Equities",
        existingQuantity: existingQty,
        statementQuantity: 0,
        deltaQuantity: deltaQty,
        existingValue: existingVal,
        statementValue: 0,
        deltaValue: deltaVal,
        diffType: "removed",
      });
    }
  });

  // Sort items: "new" first, then "modified", then "removed", then "unchanged"
  const rank: Record<DiffType, number> = {
    new: 0,
    modified: 1,
    removed: 2,
    unchanged: 3,
  };
  items.sort((a, b) => rank[a.diffType] - rank[b.diffType] || Math.abs(b.deltaValue) - Math.abs(a.deltaValue));

  const reportId = `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const auditSignature = generateAuditSignature(clientId, totalDiscrepancyValue, items.length);

  return {
    id: reportId,
    clientId,
    timestamp: new Date().toISOString(),
    statementSource,
    totalExistingValue,
    totalStatementValue,
    totalDiscrepancyValue,
    items,
    auditSignature,
  };
}

/**
 * Applies approved reconciliation diff items to the existing portfolio holdings.
 * Only tickers included in `approvedTickers` will have their modifications/additions/deletions applied.
 */
export function applyReconciliation(
  existingHoldings: PortfolioHolding[],
  diffItems: HoldingDiffItem[],
  approvedTickers: string[]
): PortfolioHolding[] {
  const approvedSet = new Set(approvedTickers.map(normalizeTicker));
  const diffMap = new Map<string, HoldingDiffItem>();
  diffItems.forEach((d) => diffMap.set(normalizeTicker(d.ticker), d));

  const updatedHoldings: PortfolioHolding[] = [];
  const handledTickers = new Set<string>();

  // 1. Process existing holdings
  for (const h of existingHoldings) {
    const key = normalizeTicker(h.ticker || h.assetName);
    const diff = diffMap.get(key);

    if (!diff || !approvedSet.has(key)) {
      // No diff or unapproved: retain original holding untouched
      updatedHoldings.push(h);
      handledTickers.add(key);
      continue;
    }

    if (diff.diffType === "removed") {
      // Approved removal: skip adding this holding (liquidated)
      handledTickers.add(key);
      continue;
    }

    if (diff.diffType === "modified") {
      // Approved modification: update quantity and current value
      updatedHoldings.push({
        ...h,
        quantity: String(diff.statementQuantity),
        currentValue: String(diff.statementValue),
        notes: h.notes ? `${h.notes} | Reconciled` : "Reconciled from statement",
      });
      handledTickers.add(key);
      continue;
    }

    // Unchanged or other
    updatedHoldings.push(h);
    handledTickers.add(key);
  }

  // 2. Add approved new holdings
  for (const diff of diffItems) {
    const key = normalizeTicker(diff.ticker);
    if (diff.diffType === "new" && approvedSet.has(key) && !handledTickers.has(key)) {
      const newHolding: PortfolioHolding = {
        id: `h-rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        assetName: diff.assetName,
        assetClass: canonicalAssetClass(diff.assetClass),
        ticker: diff.ticker,
        quantity: String(diff.statementQuantity),
        investedValue: String(diff.statementValue), // Default cost basis to current if unknown
        currentValue: String(diff.statementValue),
        targetWeight: "0",
        notes: "Imported via Statement Reconciliation",
        acquisitionDate: new Date().toISOString().split("T")[0],
      };
      updatedHoldings.push(newHolding);
      handledTickers.add(key);
    }
  }

  return updatedHoldings;
}
