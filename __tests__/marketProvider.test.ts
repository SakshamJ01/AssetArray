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

    it("fetches sector performance breakdown", async () => {
      const sectors = await unifiedMarketProvider.getSectorPerformance();
      expect(Array.isArray(sectors)).toBe(true);
      expect(sectors.length).toBeGreaterThanOrEqual(4);
      expect(sectors[0]).toHaveProperty("sector");
      expect(sectors[0]).toHaveProperty("performancePercent");
    });

    it("generates historical price trends", async () => {
      const history = await unifiedMarketProvider.getHistoricalPrices("AAPL", 14);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(15);
      expect(history[0]).toHaveProperty("close");
      expect(history[0]).toHaveProperty("date");
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
