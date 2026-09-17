/**
 * AssetArray 4.0 — Canonical Record Normalizer
 * Transforms raw ingested records into strictly normalized canonical structures.
 * Never invents missing values; marks incomplete fields explicitly.
 */

import { CanonicalRecord, DataQualityState, RawSourceRecord } from "../../../types/v4/computation";
import { createProvenanceRecord } from "./provenance";

function cleanNumber(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function normalizeAssetClass(rawClass?: string, name?: string, symbol?: string): CanonicalRecord["assetClass"] {
  const combined = `${rawClass || ""} ${name || ""} ${symbol || ""}`.toLowerCase();
  if (combined.includes("gold") || combined.includes("silver") || combined.includes("commodity") || combined.includes("bees")) return "Commodities";
  if (combined.includes("bond") || combined.includes("debt") || combined.includes("treasury") || combined.includes("gilt") || combined.includes("fixed")) return "Fixed Income";
  if (combined.includes("fund") || combined.includes("mf") || combined.includes("mutual") || combined.includes("flexi")) return "Mutual Fund";
  if (combined.includes("reit") || combined.includes("alt") || combined.includes("invit") || combined.includes("crypto")) return "Alternatives";
  if (combined.includes("cash") || combined.includes("bank") || combined.includes("liquid")) return "Cash";
  return "Equity";
}

export function normalizeRawRecord(
  raw: RawSourceRecord,
  tenantId: string,
  ingestionJobId: string,
  sourceName: string
): CanonicalRecord {
  const f = raw.rawFields || {};

  const symbol = String(f.symbol || f.ticker || f.isin || f.scrip || f.code || f.security || f.assetName || "").trim().toUpperCase();
  const securityName = String(f.securityName || f.assetName || f.companyName || f.instrument || f.schemeName || symbol || "Unknown Security").trim();
  const isin = f.isin ? String(f.isin).trim().toUpperCase() : undefined;

  const quantity = cleanNumber(f.quantity || f.units || f.shares || f.qty);
  const price = cleanNumber(f.price || f.ltp || f.currentPrice || f.cmp || f.nav || f.marketPrice);
  let currentValue = cleanNumber(f.currentValue || f.marketValue || f.totalValue || f.value);
  let investedAmount = cleanNumber(f.investedAmount || f.costBasis || f.investedValue || f.avgPrice ? (cleanNumber(f.avgPrice) * quantity) : 0);

  // Derivations without invention
  if (currentValue === 0 && price > 0 && quantity > 0) {
    currentValue = Math.round(price * quantity * 100) / 100;
  }
  if (investedAmount === 0 && currentValue > 0) {
    investedAmount = currentValue;
  }

  const currency = (f.currency ? String(f.currency).trim().toUpperCase() : "INR");
  const transactionDate = f.transactionDate ? String(f.transactionDate).trim() : undefined;
  const acquisitionDate = f.acquisitionDate ? String(f.acquisitionDate).trim() : undefined;
  const accountNumber = f.accountNumber || f.folioNo || f.account ? String(f.accountNumber || f.folioNo || f.account).trim() : undefined;

  const assetClass = normalizeAssetClass(f.assetClass || f.type || f.category, securityName, symbol);

  const unmappedFields: string[] = [];
  if (!symbol) unmappedFields.push("symbol");
  if (!acquisitionDate) unmappedFields.push("acquisitionDate");
  if (!isin) unmappedFields.push("isin");

  let qualityState: DataQualityState = "COMPLETE";
  if (!symbol || quantity <= 0) {
    qualityState = "MISSING";
  } else if (!acquisitionDate || unmappedFields.length > 0) {
    qualityState = "PARTIAL";
  }

  const provenance = createProvenanceRecord(sourceName, ingestionJobId, {
    sourceRecordId: raw.recordId,
    confidence: qualityState === "COMPLETE" ? "HIGH" : qualityState === "PARTIAL" ? "MEDIUM" : "LOW",
    originalValue: raw.rawFields,
  });

  return {
    canonicalId: `can-${raw.recordId}`,
    tenantId,
    accountNumber,
    symbol: symbol || `UNMAPPED-${raw.recordId}`,
    securityName,
    isin,
    quantity,
    price,
    investedAmount,
    currentValue,
    transactionDate,
    acquisitionDate,
    currency,
    assetClass,
    provenance,
    qualityState,
    unmappedFields,
  };
}
