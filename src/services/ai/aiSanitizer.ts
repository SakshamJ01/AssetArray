import { Client, PortfolioHolding } from "../../types/wealth";

export interface SanitizedHoldingContext {
  id: string;
  assetClass: string;
  category: string;
  weightPct: number;
  unrealizedGainLossPct: number;
  country: string;
  currency: string;
}

export interface SanitizedClientContext {
  anonymizedRef: string; // e.g. "Client Ref #AA-482"
  category: string; // e.g. "HNI"
  riskProfile: string; // e.g. "Balanced"
  totalPortfolioValue: number;
  holdingsCount: number;
  holdings: SanitizedHoldingContext[];
  liabilitiesValue: number;
}

/**
 * DPDP Act 2023 & Institutional Privacy Filter
 * Removes all Personally Identifiable Information (PII):
 * Names, Emails, Phone numbers, PAN numbers, Aadhaar, Account numbers, and free-form PII notes.
 */
export function sanitizeForAI(client: Client): SanitizedClientContext {
  // Deterministic 3-digit reference code derived solely from client ID
  let hash = 0;
  for (let i = 0; i < (client.id || "").length; i++) {
    hash = (hash << 5) - hash + client.id.charCodeAt(i);
    hash |= 0;
  }
  const refNum = Math.abs(hash % 900) + 100;
  const anonymizedRef = `Client Ref #AA-${refNum}`;

  const rawHoldings = client.portfolio || [];
  const totalVal = rawHoldings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );

  const holdings: SanitizedHoldingContext[] = rawHoldings.map((h, idx) => {
    const cur = Number(h.currentValue) || 0;
    const inv = Number(h.investedValue) || 0;
    const gainLossPct = inv > 0 ? ((cur - inv) / inv) * 100 : 0;
    const weightPct = totalVal > 0 ? (cur / totalVal) * 100 : 0;

    return {
      id: `pos_${idx + 1}`,
      assetClass: h.assetClass || "Stocks",
      category: h.assetClass || "Stocks",
      weightPct: parseFloat(weightPct.toFixed(2)),
      unrealizedGainLossPct: parseFloat(gainLossPct.toFixed(2)),
      country: h.country || "India",
      currency: h.currency || "INR",
    };
  });

  return {
    anonymizedRef,
    category: client.category || "HNI",
    riskProfile: client.riskProfile || "Balanced",
    totalPortfolioValue: Math.round(totalVal),
    holdingsCount: holdings.length,
    holdings,
    liabilitiesValue: 0,
  };
}

/**
 * Scrubs potential PII substrings (PAN, phone, email) from prompt strings
 */
export function scrubPiiFromText(text: string): string {
  if (!text) return "";

  return text
    // Mask Indian PAN: [A-Z]{5}[0-9]{4}[A-Z]{1}
    .replace(/[A-Z]{5}[0-9]{4}[A-Z]{1}/gi, "[PAN_REDACTED]")
    // Mask 10-12 digit phone / account numbers
    .replace(/\b[6-9]\d{9}\b/g, "[PHONE_REDACTED]")
    .replace(/\b\d{11,16}\b/g, "[ACCOUNT_REDACTED]")
    // Mask emails
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[EMAIL_REDACTED]");
}
