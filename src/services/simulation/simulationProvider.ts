/**
 * Simulation Market Provider
 * Exclusively used in DEMO mode for offline mock testing and Monte Carlo models.
 * Strictly isolated from live production market feeds.
 */

import { HistoricalPricePoint, SectorPerformance } from "../market/marketProvider";

export class SimulationMarketProvider {
  readonly providerId = "simulation";
  readonly providerName = "Offline Simulation Engine (Demo Only)";

  public getSectorPerformance(): SectorPerformance[] {
    return [
      { sector: "Technology", performancePercent: 1.45, momentum: "Bullish", leadingStock: "NVDA" },
      { sector: "Financial Services", performancePercent: 0.62, momentum: "Bullish", leadingStock: "HDFCBANK" },
      { sector: "Healthcare", performancePercent: -0.15, momentum: "Neutral", leadingStock: "SUNPHARMA" },
      { sector: "Consumer", performancePercent: 0.30, momentum: "Neutral", leadingStock: "TITAN" },
      { sector: "Energy", performancePercent: -0.45, momentum: "Bearish", leadingStock: "RELIANCE" },
    ];
  }

  public getSimulatedHistoricalPrices(symbol: string, days = 30): HistoricalPricePoint[] {
    const points: HistoricalPricePoint[] = [];
    const now = Date.now();
    const basePrice = 150;
    for (let i = days; i >= 0; i--) {
      const ts = now - i * 86400000;
      points.push({
        timestamp: ts,
        date: new Date(ts).toISOString().slice(0, 10),
        close: +(basePrice * (1 + Math.sin(i / 3) * 0.04)).toFixed(2),
        volume: 500000,
      });
    }
    return points;
  }

  public getHistoricalPrices(symbol: string, days = 30): HistoricalPricePoint[] {
    return this.getSimulatedHistoricalPrices(symbol, days);
  }
}

export const simulationProvider = new SimulationMarketProvider();
