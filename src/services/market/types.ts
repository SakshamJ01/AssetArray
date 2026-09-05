import { LiveInstrument } from "../realTimeMarket";

export interface SectorPerformance {
  sector: string;
  performancePercent: number;
  momentum: "Bullish" | "Neutral" | "Bearish";
  leadingStock: string;
}

export interface HistoricalPricePoint {
  timestamp: number;
  date: string;
  close: number;
  volume: number;
}

export interface MarketDataProvider {
  readonly providerId: string;
  readonly providerName: string;
  isAvailable(): Promise<boolean>;
  getQuote(symbol: string): Promise<Partial<LiveInstrument> | null>;
  getSectorPerformance(): Promise<SectorPerformance[]>;
  getHistoricalPrices(symbol: string, days?: number): Promise<HistoricalPricePoint[]>;
}
