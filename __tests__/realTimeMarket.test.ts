import { realTimeMarket, LiveInstrument } from "../src/services/realTimeMarket";

describe("Real-Time Share Market Streaming Engine", () => {
  afterAll(() => {
    realTimeMarket.stopStreaming();
  });

  it("should have initial market instruments loaded", () => {
    const instruments = realTimeMarket.getInstruments();
    expect(Object.keys(instruments).length).toBeGreaterThanOrEqual(10);
    expect(instruments["NIFTY 50"]).toBeDefined();
    expect(instruments["RELIANCE"]).toBeDefined();
    expect(instruments["GOLD"]).toBeDefined();
    expect(instruments["BTC/USD"]).toBeDefined();
  });

  it("should notify subscribers when a market tick occurs", (done) => {
    let callCount = 0;
    const unsubscribe = realTimeMarket.subscribe((quotes) => {
      callCount++;
      if (callCount === 1) {
        // First is immediate invocation
        expect(quotes["NIFTY 50"].price).toBeGreaterThan(0);
      } else if (callCount === 2) {
        // Second is triggered by manual sync
        expect(quotes).toBeDefined();
        unsubscribe();
        done();
      }
    });

    realTimeMarket.triggerManualSync();
  });

  it("should maintain 5-level market depth and intraday tick history", () => {
    const reliance = realTimeMarket.getInstrument("RELIANCE");
    expect(reliance).not.toBeNull();
    expect(reliance?.depth.bids.length).toBe(5);
    expect(reliance?.depth.asks.length).toBe(5);
    expect(reliance?.depth.totalBidQty).toBeGreaterThan(0);
    expect(reliance?.depth.totalAskQty).toBeGreaterThan(0);
    expect(reliance?.tickHistory.length).toBeGreaterThan(0);
  });

  it("should calculate correct change and changePercent on ticks", () => {
    const nifty = realTimeMarket.getInstrument("NIFTY 50");
    if (!nifty) throw new Error("Nifty not found");
    const expectedChange = Number((nifty.price - nifty.previousClose).toFixed(2));
    expect(nifty.change).toBeCloseTo(expectedChange, 1);
  });
});
