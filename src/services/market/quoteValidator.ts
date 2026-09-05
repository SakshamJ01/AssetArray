/**
 * Validates quote schema: rejects negative price, NaN, Infinity, impossible timestamps, invalid symbols.
 */
export function validateQuoteSchema(quote: any): { isValid: boolean; reason?: string } {
  if (!quote || typeof quote !== "object") {
    return { isValid: false, reason: "Quote object is null or not an object." };
  }
  if (!quote.symbol || typeof quote.symbol !== "string" || quote.symbol.trim().length === 0) {
    return { isValid: false, reason: "Invalid symbol." };
  }
  if (typeof quote.price !== "number" || isNaN(quote.price) || !isFinite(quote.price) || quote.price <= 0) {
    return { isValid: false, reason: "Invalid price: must be a positive finite number." };
  }
  if (quote.change != null && (isNaN(quote.change) || !isFinite(quote.change))) {
    return { isValid: false, reason: "Invalid change: cannot be NaN or Infinite." };
  }
  if (quote.changePercent != null && (isNaN(quote.changePercent) || !isFinite(quote.changePercent))) {
    return { isValid: false, reason: "Invalid changePercent: cannot be NaN or Infinite." };
  }
  if (quote.lastUpdated != null) {
    const ts = Number(quote.lastUpdated);
    const now = Date.now();
    if (isNaN(ts) || ts > now + 60000 || ts < now - 10 * 365 * 86400000) {
      return { isValid: false, reason: "Impossible timestamp." };
    }
  }
  return { isValid: true };
}

/**
 * Calculates human-readable quote freshness label (LIVE · 3s old, DELAYED · 8m old, STALE · 28m old, UNAVAILABLE).
 */
export function getQuoteFreshnessLabel(
  lastUpdated: number | null | undefined,
  qualityStatus?: string
): string {
  if (lastUpdated == null || isNaN(lastUpdated) || lastUpdated <= 0) {
    return "UNAVAILABLE";
  }

  const now = Date.now();
  const ageSeconds = Math.max(0, Math.floor((now - lastUpdated) / 1000));

  if (qualityStatus === "SIMULATED") {
    return "SIMULATED";
  }
  if (ageSeconds < 60) {
    return `LIVE · ${ageSeconds}s old`;
  }
  if (ageSeconds < 900) {
    const mins = Math.floor(ageSeconds / 60);
    return `DELAYED · ${mins}m old`;
  }
  const mins = Math.floor(ageSeconds / 60);
  return `STALE · ${mins}m old`;
}
