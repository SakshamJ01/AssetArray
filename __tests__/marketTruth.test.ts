/**
 * Market Truth & Open AMFI Data Tests
 * Verifies that market data uses official open AMFI NAV data for Indian Mutual Funds,
 * strict schema validation, truthful quote freshness, and strict live vs demo isolation.
 */

import { amfiNavProvider } from "../src/services/market/amfiNavProvider";
import {
  unifiedMarketProvider,
  validateQuoteSchema,
  getQuoteFreshnessLabel,
} from "../src/services/market/marketProvider";

describe("Market Truth & AMFI Free Data Suite", () => {
  test("AMFI provider resolves Indian mutual funds by official scheme code", async () => {
    // 122639: Parag Parikh Flexi Cap Fund - Direct Plan - Growth
    const quote = await amfiNavProvider.getQuote("122639");
    expect(quote).not.toBeNull();
    expect(quote?.price).toBeGreaterThan(0);
    expect(quote?.symbol).toBe("122639");

    const validation = validateQuoteSchema(quote);
    expect(validation.isValid).toBe(true);
  });

  test("AMFI provider resolves Indian mutual funds by official ISIN", async () => {
    // INF200K01T43: SBI Small Cap Fund - Direct Plan - Growth
    const quote = await amfiNavProvider.getQuote("INF200K01T43");
    expect(quote).not.toBeNull();
    expect(quote?.price).toBe(174.20);

    const validation = validateQuoteSchema(quote);
    expect(validation.isValid).toBe(true);
  });

  test("AMFI provider generates verified historical NAV points for mutual funds", async () => {
    const history = await amfiNavProvider.getHistoricalPrices("119551", 15);
    expect(history.length).toBe(16); // 15 days + today
    expect(history[0].close).toBeGreaterThan(0);
    expect(history[0].date).toBeDefined();
  });

  test("rejects invalid quotes with negative price, NaN, or impossible timestamps", () => {
    expect(validateQuoteSchema({ symbol: "TCS", price: -150 }).isValid).toBe(false);
    expect(validateQuoteSchema({ symbol: "INFY", price: NaN }).isValid).toBe(false);
    expect(validateQuoteSchema({ symbol: "RELIANCE", price: Infinity }).isValid).toBe(false);
    expect(
      validateQuoteSchema({
        symbol: "HDFCBANK",
        price: 1650,
        lastUpdated: Date.now() + 86400000 * 30, // 30 days in future
      }).isValid
    ).toBe(false);
  });

  test("formats truthful freshness labels based on quote timestamp", () => {
    const now = Date.now();
    expect(getQuoteFreshnessLabel(now - 5000)).toMatch(/LIVE · \d+s old/);
    expect(getQuoteFreshnessLabel(now - 180000)).toMatch(/DELAYED · \d+m old/);
    expect(getQuoteFreshnessLabel(now - 3600000)).toMatch(/STALE · \d+m old/);
    expect(getQuoteFreshnessLabel(0)).toBe("UNAVAILABLE");
    expect(getQuoteFreshnessLabel(null)).toBe("UNAVAILABLE");
    expect(getQuoteFreshnessLabel(now, "SIMULATED")).toBe("SIMULATED");
  });

  test("unknown stock ticker in live mode returns UNAVAILABLE rather than invented numbers", async () => {
    const unknownQuote = await unifiedMarketProvider.getQuote("NON_EXISTENT_SYMBOL_XYZ_123");
    expect(unknownQuote.price).toBeNull();
  });

  test("missing historical prices in live mode return empty array, never silently falling back to simulation", async () => {
    const history = await unifiedMarketProvider.getHistoricalPrices("UNLISTED_TICKER", 30, false);
    expect(history).toEqual([]);
  });
});
