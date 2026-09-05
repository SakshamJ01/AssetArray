import {
  unifiedMarketProvider,
  validateQuoteSchema,
  getQuoteFreshnessLabel,
  marketHealthMonitor,
} from "../src/services/market";

describe("Market Provider Truth & Data Hygiene Suite", () => {
  describe("Rule 19: Unknown Quote Rule", () => {
    it("returns null price for unknown symbols without inventing 100 or 0.5%", async () => {
      const quote = await unifiedMarketProvider.getQuote("FAKE_SYMBOL_UNKNOWN_9999");
      expect(quote.symbol).toBe("FAKE_SYMBOL_UNKNOWN_9999");
      expect(quote.price).toBeNull();
      expect(quote.change).toBeNull();
      expect(quote.changePercent).toBeNull();

      // Zero fabricated numbers
      expect(quote.price).not.toBe(100);
      expect(quote.changePercent).not.toBe(0.5);
      expect(quote.changePercent).not.toBe(0);
    });
  });

  describe("Rule 20: Historical Price Rule", () => {
    it("returns empty history array in live mode when provider data is unavailable (never synthetic)", async () => {
      // isDemoMode = false
      const history = await unifiedMarketProvider.getHistoricalPrices("NONEXISTENT_TICKER", 30, false);
      expect(Array.isArray(history)).toBe(true);
      // In live mode with unconfigured or missing provider data, history must be empty (NOT synthetic)
      expect(history.length).toBe(0);
    });

    it("explicitly labels simulated history only when isDemoMode = true", async () => {
      const demoHistory = await unifiedMarketProvider.getHistoricalPrices("RELIANCE", 14, true);
      expect(Array.isArray(demoHistory)).toBe(true);
      expect(demoHistory.length).toBeGreaterThan(0);
    });
  });

  describe("Rule 21: Current Market Provider Audit", () => {
    it("discloses unconfigured providers as NOT_CONFIGURED and never active", () => {
      const records = marketHealthMonitor.getAllHealthRecords();
      const alpha = records.find((r) => r.providerId === "alphavantage");
      const polygon = records.find((r) => r.providerId === "polygon");
      const fmp = records.find((r) => r.providerId === "fmp");

      expect(alpha?.status).toBe("NOT_CONFIGURED");
      expect(polygon?.status).toBe("NOT_CONFIGURED");
      expect(fmp?.status).toBe("NOT_CONFIGURED");

      // Availability must be 0 for unconfigured providers
      expect(alpha?.availabilityPct).toBe(0);
      expect(polygon?.availabilityPct).toBe(0);
      expect(fmp?.availabilityPct).toBe(0);
    });
  });

  describe("Rule 25: Quote Validation & Schema Defense", () => {
    it("accepts valid live quotes", () => {
      expect(validateQuoteSchema({ symbol: "TCS", price: 3850.5, change: 25.5, changePercent: 0.67 }).isValid).toBe(true);
    });

    it("rejects negative, NaN, and Infinite prices", () => {
      expect(validateQuoteSchema({ symbol: "TCS", price: -10 }).isValid).toBe(false);
      expect(validateQuoteSchema({ symbol: "TCS", price: NaN }).isValid).toBe(false);
      expect(validateQuoteSchema({ symbol: "TCS", price: Infinity }).isValid).toBe(false);
      expect(validateQuoteSchema({ symbol: "TCS", price: 0 }).isValid).toBe(false);
    });

    it("rejects impossible future timestamps", () => {
      const futureTime = Date.now() + 86400000 * 365; // 1 year in future
      expect(validateQuoteSchema({ symbol: "TCS", price: 3850, lastUpdated: futureTime }).isValid).toBe(false);
    });
  });

  describe("Rule 26: Market Freshness Labeling", () => {
    it("formats quote freshness according to age thresholds", () => {
      const now = Date.now();
      expect(getQuoteFreshnessLabel(now - 10000)).toMatch(/LIVE · 10s old/);
      expect(getQuoteFreshnessLabel(now - 180000)).toMatch(/DELAYED · 3m old/);
      expect(getQuoteFreshnessLabel(now - 1500000)).toMatch(/STALE · 25m old/);
      expect(getQuoteFreshnessLabel(null)).toBe("UNAVAILABLE");
    });
  });
});
