import {
  realTimeMarket,
  calculateRSI,
  calculateSpreadBps,
} from "../src/services/realTimeMarket";

describe("Real-Time Market Enhancements & Technical Indicators", () => {
  it("includes newly added institutional instruments (ITC, NVDA, SILVER)", () => {
    const quotes = realTimeMarket.getQuotes();

    expect(quotes["ITC"]).toBeDefined();
    expect(quotes["ITC"].symbol).toBe("ITC");
    expect(quotes["ITC"].exchange).toBe("NSE");
    expect(quotes["ITC"].price).toBeGreaterThan(400);

    expect(quotes["NVDA"]).toBeDefined();
    expect(quotes["NVDA"].symbol).toBe("NVDA");
    expect(quotes["NVDA"].exchange).toBe("NASDAQ");
    expect(quotes["NVDA"].currency).toBe("USD");

    expect(quotes["SILVER"]).toBeDefined();
    expect(quotes["SILVER"].symbol).toBe("SILVER");
    expect(quotes["SILVER"].exchange).toBe("MCX");
    expect(quotes["SILVER"].price).toBeGreaterThan(80000);
  });

  it("calculates Relative Strength Index (RSI) accurately", () => {
    // Insufficient data defaults to 50 neutral
    expect(calculateRSI([])).toBe(50);
    expect(calculateRSI([100])).toBe(50);

    // Strictly upward trending series should give RSI = 100
    const upward = [100, 102, 104, 106, 108, 110];
    expect(calculateRSI(upward)).toBe(100);

    // Strictly downward trending series should give RSI = 0
    const downward = [110, 108, 106, 104, 102, 100];
    expect(calculateRSI(downward)).toBe(0);

    // Balanced series should give a mid-range RSI
    const balanced = [100, 105, 102, 106, 103, 107, 104];
    const rsi = calculateRSI(balanced);
    expect(rsi).toBeGreaterThan(40);
    expect(rsi).toBeLessThan(75);
  });

  it("calculates Bid-Ask spread in basis points (bps) correctly", () => {
    const mockDepth = {
      bids: [{ price: 99.9, quantity: 100, orders: 5 }],
      asks: [{ price: 100.1, quantity: 100, orders: 5 }],
      totalBidQty: 100,
      totalAskQty: 100,
    };

    // Spread = 100.1 - 99.9 = 0.2
    // Spread bps = (0.2 / 100) * 10000 = 20 bps
    const spread = calculateSpreadBps(mockDepth, 100);
    expect(spread).toBe(20);
  });
});
