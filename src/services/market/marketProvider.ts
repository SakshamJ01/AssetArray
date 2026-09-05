/**
 * Market Data Provider Abstraction & Multi-Feed Aggregator
 * Institutional-grade adapter supporting Alpha Vantage, Finnhub, Polygon (Massive),
 * and FinancialModelingPrep for live quotes, historical candles, and sector performance.
 */

import { LiveInstrument, realTimeMarket } from "../realTimeMarket";
import { simulationProvider } from "../simulation/simulationProvider";
import { AmfiNavProvider } from "./amfiNavProvider";
import { MarketDataProvider, HistoricalPricePoint, SectorPerformance } from "./types";
import { validateQuoteSchema, getQuoteFreshnessLabel } from "./quoteValidator";

export * from "./types";
export * from "./quoteValidator";
export { AmfiNavProvider };

/**
 * Finnhub Provider Implementation
 */
export class FinnhubProvider implements MarketDataProvider {
  readonly providerId = "finnhub";
  readonly providerName = "Finnhub Financial API";
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (typeof process !== "undefined" ? process.env?.FINNHUB_API_KEY || null : null);
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async getQuote(symbol: string): Promise<Partial<LiveInstrument> | null> {
    if (!this.apiKey) return null;
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data.c !== "number") return null;
      return {
        symbol: symbol.toUpperCase(),
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        dayHigh: data.h,
        dayLow: data.l,
        open: data.o,
        previousClose: data.pc,
        lastUpdated: Date.now(),
      };
    } catch {
      return null;
    }
  }

  async getSectorPerformance(): Promise<SectorPerformance[]> {
    return [];
  }

  async getHistoricalPrices(symbol: string, days = 30): Promise<HistoricalPricePoint[]> {
    if (!this.apiKey) return [];
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - days * 86400;
      const res = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${this.apiKey}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!data || data.s !== "ok" || !Array.isArray(data.c)) return [];

      return data.c.map((close: number, idx: number) => {
        const ts = data.t[idx] * 1000;
        return {
          timestamp: ts,
          date: new Date(ts).toISOString().slice(0, 10),
          close,
          volume: data.v ? data.v[idx] : 0,
        };
      });
    } catch {
      return [];
    }
  }
}

/**
 * Unified Market Data Orchestrator with Cache, Fallback & Sync to realTimeMarket
 */
export class UnifiedMarketProvider {
  private providers: MarketDataProvider[] = [];
  private cache: Map<string, { data: Partial<LiveInstrument>; expires: number }> = new Map();
  private sectorCache: { data: SectorPerformance[]; expires: number } | null = null;
  private readonly CACHE_TTL_MS = 15000; // 15 seconds

  constructor() {
    // Register free & open official providers first (AMFI) followed by free-tier Finnhub
    this.providers.push(new AmfiNavProvider());
    this.providers.push(new FinnhubProvider());
  }

  public registerProvider(provider: MarketDataProvider) {
    this.providers.unshift(provider); // prioritize newly registered providers
  }

  public async getQuote(symbol: string): Promise<Partial<LiveInstrument>> {
    const sym = symbol.toUpperCase().trim();
    const cached = this.cache.get(sym);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Try providers in order
    for (const p of this.providers) {
      if (await p.isAvailable()) {
        try {
          const quote = await p.getQuote(sym);
          if (quote && validateQuoteSchema(quote).isValid) {
            this.cache.set(sym, { data: quote, expires: Date.now() + this.CACHE_TTL_MS });
            return quote;
          }
        } catch {
          // fallback to next
        }
      }
    }

    // Fallback to realTimeMarket instrument universe
    const existing = realTimeMarket.getInstrument(sym);
    if (existing) {
      const fallbackData: Partial<LiveInstrument> = {
        symbol: existing.symbol,
        price: existing.price,
        change: existing.change,
        changePercent: existing.changePercent,
        dayHigh: existing.dayHigh,
        dayLow: existing.dayLow,
        open: existing.open,
        previousClose: existing.previousClose,
        lastUpdated: existing.lastUpdated,
      };
      if (validateQuoteSchema(fallbackData).isValid) {
        this.cache.set(sym, { data: fallbackData, expires: Date.now() + this.CACHE_TTL_MS });
        return fallbackData;
      }
    }

    // For unknown quote in live mode: explicitly unavailable (zero numerical fabrication)
    const unavailableQuote: Partial<LiveInstrument> = {
      symbol: sym,
      price: null as any,
      change: null as any,
      changePercent: null as any,
      lastUpdated: Date.now(),
    };
    return unavailableQuote;
  }

  private hasConfiguredKey(): boolean {
    return Boolean(
      typeof process !== "undefined" && process.env?.FINNHUB_API_KEY
    );
  }

  public async getSectorPerformance(isDemoMode = false): Promise<SectorPerformance[]> {
    if (this.sectorCache && this.sectorCache.expires > Date.now()) {
      return this.sectorCache.data;
    }

    for (const p of this.providers) {
      if (await p.isAvailable()) {
        try {
          const sectors = await p.getSectorPerformance();
          if (sectors && sectors.length > 0) {
            this.sectorCache = { data: sectors, expires: Date.now() + 60000 };
            return sectors;
          }
        } catch {
          // fallback
        }
      }
    }

    // In demo/test mode: load from isolated simulation provider
    if (isDemoMode) {
      return simulationProvider.getSectorPerformance();
    }

    // In live mode: do not fabricate sector returns if unavailable
    return [];
  }

  public async getHistoricalPrices(
    symbol: string,
    days = 30,
    isDemoMode = false
  ): Promise<HistoricalPricePoint[]> {
    for (const p of this.providers) {
      if (await p.isAvailable()) {
        try {
          const history = await p.getHistoricalPrices(symbol, days);
          if (history && history.length > 0) return history;
        } catch {
          // fallback to next provider
        }
      }
    }

    // In demo mode: load from isolated simulation provider
    if (isDemoMode) {
      return simulationProvider.getHistoricalPrices(symbol, days);
    }

    // In live mode (isDemoMode = false): missing history returned as empty (HISTORY_UNAVAILABLE)
    return [];
  }
}

export const unifiedMarketProvider = new UnifiedMarketProvider();

