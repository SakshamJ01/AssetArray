import { unifiedMarketProvider } from "../src/services/market/marketProvider";
import { custodianSyncService } from "../src/services/custodian/custodianSync";
import { marketNewsService } from "../src/services/market/newsFeed";

describe("Market Data Provider, Custodian Aggregator & News Services", () => {
  describe("UnifiedMarketProvider", () => {
    it("fetches quotes for common instruments with fallback resilience", async () => {
      const quote = await unifiedMarketProvider.getQuote("NIFTY 50");
      expect(quote).toBeDefined();
      expect(quote.symbol).toBe("NIFTY 50");
      expect(typeof quote.price).toBe("number");
      expect(quote.price).toBeGreaterThan(0);
    });

    it("fetches sector performance breakdown in demo/simulation mode", async () => {
      const sectors = await unifiedMarketProvider.getSectorPerformance(true);
      expect(Array.isArray(sectors)).toBe(true);
      expect(sectors.length).toBeGreaterThanOrEqual(4);
      expect(sectors[0]).toHaveProperty("sector");
      expect(sectors[0]).toHaveProperty("performancePercent");
    });

    it("generates historical price trends in demo/simulation mode", async () => {
      const history = await unifiedMarketProvider.getHistoricalPrices("AAPL", 14, true);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(15);
      expect(history[0]).toHaveProperty("close");
      expect(history[0]).toHaveProperty("date");
    });

    it("returns UNAVAILABLE with null price for unknown symbols (zero fabricated 100/0.5%)", async () => {
      const quote = await unifiedMarketProvider.getQuote("XYZ_UNKNOWN_SYMBOL_999");
      expect(quote.symbol).toBe("XYZ_UNKNOWN_SYMBOL_999");
      expect(quote.price).toBeNull();
      expect(quote.change).toBeNull();
      expect(quote.changePercent).toBeNull();
    });

    it("validates quote schemas and rejects negative, NaN, and Infinite prices", () => {
      const { validateQuoteSchema } = require("../src/services/market");
      expect(validateQuoteSchema({ symbol: "AAPL", price: 150.5 }).isValid).toBe(true);
      expect(validateQuoteSchema({ symbol: "AAPL", price: -10 }).isValid).toBe(false);
      expect(validateQuoteSchema({ symbol: "AAPL", price: NaN }).isValid).toBe(false);
      expect(validateQuoteSchema({ symbol: "AAPL", price: Infinity }).isValid).toBe(false);
      expect(validateQuoteSchema({ symbol: "", price: 100 }).isValid).toBe(false);
    });

    it("computes accurate quote freshness labels", () => {
      const { getQuoteFreshnessLabel } = require("../src/services/market");
      const now = Date.now();
      expect(getQuoteFreshnessLabel(now - 15000)).toMatch(/LIVE · 1[5-9]s old/);
      expect(getQuoteFreshnessLabel(now - 300000)).toMatch(/DELAYED · 5m old/);
      expect(getQuoteFreshnessLabel(now - 1800000)).toMatch(/STALE · 30m old/);
      expect(getQuoteFreshnessLabel(null)).toBe("UNAVAILABLE");
    });
  });

  describe("CustodianSyncService", () => {
    it("retrieves client custodial accounts", () => {
      const accounts = custodianSyncService.getClientAccounts("client-1");
      expect(accounts.length).toBeGreaterThanOrEqual(1);
      expect(accounts[0].custodian).toMatch(/BridgeFT|Plaid/);
    });

    it("links a new custodial account", async () => {
      const acc = await custodianSyncService.linkAccount(
        "client-test-2",
        "Morgan Stanley Wealth",
        "BridgeFT",
        "Taxable"
      );
      expect(acc.institutionName).toBe("Morgan Stanley Wealth");
      expect(acc.custodian).toBe("BridgeFT");
      expect(acc.status).toBe("connected");
    });

    it("synchronizes custodial accounts and updates holdings", async () => {
      const syncResult = await custodianSyncService.syncClientAccounts("client-1");
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedAccounts).toBeGreaterThanOrEqual(1);
      expect(syncResult.reconciledPositions).toBeGreaterThanOrEqual(1);
    });
  });

  describe("MarketNewsService", () => {
    it("returns latest macroeconomic news headlines", () => {
      const news = marketNewsService.getLatestNews();
      expect(news.length).toBeGreaterThanOrEqual(3);
      expect(news[0]).toHaveProperty("headline");
      expect(news[0]).toHaveProperty("sentiment");
    });

    it("generates grounded context for AI copilot queries", () => {
      const context = marketNewsService.getGroundingContextForAI(["AAPL", "MSFT"]);
      expect(context).toContain("Tech Mega-Caps");
      expect(context.length).toBeGreaterThan(50);
    });
  });
});
