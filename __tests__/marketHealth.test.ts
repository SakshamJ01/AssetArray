import {
  marketHealthMonitor,
  centralizedMarketStream,
} from "../src/services/market";

describe("Market Health & Centralized Market Stream", () => {
  it("explicitly discloses unconfigured providers as NOT_CONFIGURED", () => {
    const records = marketHealthMonitor.getAllHealthRecords();
    expect(records.length).toBeGreaterThanOrEqual(4);

    const alphavantage = records.find((r) => r.providerId === "alphavantage");
    expect(alphavantage?.status).toBe("NOT_CONFIGURED");

    const polygon = records.find((r) => r.providerId === "polygon");
    expect(polygon?.status).toBe("NOT_CONFIGURED");

    const fmp = records.find((r) => r.providerId === "fmp");
    expect(fmp?.status).toBe("NOT_CONFIGURED");
  });

  it("evaluates holding valuation disclosure states accurately", () => {
    const now = Date.now();

    // 1. Live quote
    const live = marketHealthMonitor.evaluateHoldingValuation("TCS", 4250, now, "Finnhub", "INR");
    expect(live.quality).toBe("REAL_TIME");
    expect(live.disclosureText).toContain("Live quote");

    // 2. Stale quote (> 15 mins old)
    const staleTime = now - 25 * 60 * 1000;
    const stale = marketHealthMonitor.evaluateHoldingValuation("RELIANCE", 2950, staleTime, "Finnhub", "INR");
    expect(stale.quality).toBe("STALE_PRICE");
    expect(stale.disclosureText).toContain("STALE PRICE");

    // 3. Unavailable / missing price
    const missing = marketHealthMonitor.evaluateHoldingValuation("UNKNOWN", null, null, "Finnhub", "INR");
    expect(missing.quality).toBe("VALUATION_INCOMPLETE");
    expect(missing.disclosureText).toContain("VALUATION INCOMPLETE");
  });

  it("streams instruments through centralized pub/sub stream without individual screen polling", (done) => {
    let unsubscribe: (() => void) | null = null;
    unsubscribe = centralizedMarketStream.subscribe((quotes) => {
      expect(quotes).toBeInstanceOf(Map);
      expect(quotes.size).toBeGreaterThan(0);
      if (unsubscribe) {
        unsubscribe();
      }
      done();
    });
  });
});
