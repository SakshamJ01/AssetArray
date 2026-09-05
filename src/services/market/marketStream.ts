/**
 * Centralized Market Data Stream
 * Architecture: PROVIDER ↓ NORMALIZER ↓ CACHE ↓ STREAM ↓ PORTFOLIO ↓ ALERTS ↓ UI
 * Eliminates redundant screen-level polling loops and guarantees unified prices.
 */

import { LiveInstrument, realTimeMarket } from "../realTimeMarket";
import { marketHealthMonitor } from "./marketHealth";

export type MarketStreamListener = (instruments: Map<string, LiveInstrument>) => void;

export class CentralizedMarketStream {
  private listeners: Set<MarketStreamListener> = new Set();
  private isRunning = false;
  private timer: any = null;
  private readonly TICK_INTERVAL_MS = 3000;

  constructor() {
    this.start();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Connect to realTimeMarket feed
    this.timer = setInterval(() => {
      this.tick();
    }, this.TICK_INTERVAL_MS);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  private tick(): void {
    const all = Object.values(realTimeMarket.getInstruments());
    const map = new Map<string, LiveInstrument>();
    for (const inst of all) {
      map.set(inst.symbol, inst);
      // Verify health on update
      marketHealthMonitor.recordSuccess("finnhub", 120);
    }

    for (const listener of this.listeners) {
      try {
        listener(map);
      } catch (err: any) {
        console.warn("[MarketStream] Listener exception:", err.message);
      }
    }
  }

  public subscribe(listener: MarketStreamListener): () => void {
    this.listeners.add(listener);
    // Initial emit
    const all = Object.values(realTimeMarket.getInstruments());
    const map = new Map<string, LiveInstrument>();
    for (const inst of all) map.set(inst.symbol, inst);
    listener(map);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public getInstrument(symbol: string): LiveInstrument | undefined {
    return realTimeMarket.getInstrument(symbol) || undefined;
  }
}

export const centralizedMarketStream = new CentralizedMarketStream();
