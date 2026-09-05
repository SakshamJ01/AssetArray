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
      country: h.country ? h.country.trim() : "UNKNOWN",
      currency: h.currency ? h.currency.trim() : "UNKNOWN",
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
 * DPDP Act & Privacy Preserving PII Sanitizer
 * Scrubs Aadhaar, PAN, Bank Accounts, IFSC codes, Phones, Emails, and contextual client entity names.
 */
export function scrubPiiFromText(text: string, entitiesToRedact?: string[]): string {
  if (!text) return "";

  let cleaned = text
    // Mask Indian Aadhaar: 12 digits (often in 4-4-4 format: 2345 6789 0123 or 234567890123)
    .replace(/\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[AADHAAR_REDACTED]")
    // Mask Indian PAN: [A-Z]{5}[0-9]{4}[A-Z]{1}
    .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi, "[PAN_REDACTED]")
    // Mask Indian IFSC Codes: 4 letters, 0, 6 alphanumeric (e.g. HDFC0001234)
    .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/gi, "[IFSC_REDACTED]")
    // Mask Indian Mobile Numbers (+91 or starting with 6-9)
    .replace(/\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g, "[PHONE_REDACTED]")
    // Mask Bank Account Numbers (9 to 18 contiguous digits)
    .replace(/\b\d{9,18}\b/g, "[ACCOUNT_REDACTED]")
    // Mask Emails
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[EMAIL_REDACTED]");

  // Contextual entity scrubbing (names, custom identifiers)
  if (entitiesToRedact && entitiesToRedact.length > 0) {
    entitiesToRedact.forEach((entity) => {
      if (!entity || entity.trim().length < 3) return;
      const escaped = entity.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "[ENTITY_REDACTED]");
    });
  }

  return cleaned;
}
