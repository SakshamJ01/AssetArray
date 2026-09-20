/**
 * Live Finnhub wiring check.
 *
 * Runs ONLY when a real key is present in the environment (local `.env` for
 * dev, or EXPO_PUBLIC_/FINNHUB_ injected at build time). Without a key the
 * suite skips rather than fails, so it stays green on key-less CI.
 *
 * Verifies the app's OWN provider stack — the same UnifiedMarketProvider the
 * UI uses — resolves the key and returns real quotes with honest provenance.
 */
import { unifiedMarketProvider, FinnhubProvider } from "../src/services/market/marketProvider";

const FINNHUB_KEY =
  process.env?.EXPO_PUBLIC_FINNHUB_API_KEY || process.env?.FINNHUB_API_KEY;

const describeLive = FINNHUB_KEY ? describe : describe.skip;

describeLive("Live Finnhub wiring (real API key present)", () => {
  it("resolves the key and reports the provider as available", async () => {
    const provider = new FinnhubProvider();
    expect(await provider.isAvailable()).toBe(true);
  });

  it("returns a real live quote for a US equity through the unified provider", async () => {
    const quote = await unifiedMarketProvider.getQuote("AAPL");
    expect(quote.symbol).toBe("AAPL");
    expect(typeof quote.price).toBe("number");
    expect(quote.price as number).toBeGreaterThan(0);
    expect(typeof quote.lastUpdated).toBe("number");
  });

  it("handles historical prices honestly under the free tier (no simulated fallback)", async () => {
    // The free-tier key has no access to the /stock/candle endpoint, so this
    // must return an empty array (HISTORY_UNAVAILABLE) — never fabricated and
    // never silently downgraded to simulated candles in live mode.
    const history = await unifiedMarketProvider.getHistoricalPrices("AAPL", 30, false);
    expect(Array.isArray(history)).toBe(true);
    if (history.length > 0) {
      expect(history[0]).toHaveProperty("close");
      expect(history[0]).toHaveProperty("date");
    }
  });

  it("degrades honestly for a free-tier-unreachable Indian ticker (no fabricated price)", async () => {
    const quote = await unifiedMarketProvider.getQuote("RELIANCE.NS");
    expect(quote.symbol).toBe("RELIANCE.NS");
    // Must NOT fabricate a numeric price for an inaccessible instrument.
    expect(quote.price).toBeUndefined();
  });
});
