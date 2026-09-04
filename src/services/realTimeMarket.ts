/**
 * Real-Time Share Market Streaming Engine
 * Institutional-grade market feed with live ticking, orderbook depth, and portfolio valuation sync.
 * Supports NSE/BSE Equities, Global Indices, Forex, Commodities, and Crypto.
 */

export interface MarketDepthEntry {
  bids: { price: number; quantity: number; orders: number }[];
  asks: { price: number; quantity: number; orders: number }[];
  totalBidQty: number;
  totalAskQty: number;
}

export interface LiveInstrument {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE" | "NASDAQ" | "NYSE" | "MCX" | "CRYPTO" | "FX";
  currency: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  volume: number;
  vwap: number;
  lastTickDirection: "up" | "down" | "flat";
  lastUpdated: number;
  tickHistory: number[]; // Last 30 intraday tick prices for real-time charting
  depth: MarketDepthEntry;
}

export type MarketTickCallback = (quotes: Record<string, LiveInstrument>) => void;

// Initial baseline universe
const INITIAL_INSTRUMENTS: Record<string, LiveInstrument> = {
  "NIFTY 50": {
    symbol: "NIFTY 50",
    name: "Nifty 50 Index",
    exchange: "NSE",
    currency: "INR",
    price: 24852.15,
    previousClose: 24740.0,
    change: 112.15,
    changePercent: 0.45,
    dayHigh: 24890.3,
    dayLow: 24710.2,
    open: 24750.0,
    volume: 18450000,
    vwap: 24810.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [24740, 24760, 24755, 24790, 24810, 24830, 24852.15],
    depth: {
      bids: [
        { price: 24851.5, quantity: 450, orders: 12 },
        { price: 24850.0, quantity: 1200, orders: 34 },
        { price: 24848.5, quantity: 950, orders: 18 },
        { price: 24845.0, quantity: 2400, orders: 55 },
        { price: 24840.0, quantity: 3800, orders: 82 },
      ],
      asks: [
        { price: 24852.5, quantity: 500, orders: 15 },
        { price: 24854.0, quantity: 850, orders: 22 },
        { price: 24856.0, quantity: 1400, orders: 39 },
        { price: 24860.0, quantity: 2100, orders: 61 },
        { price: 24865.0, quantity: 4200, orders: 94 },
      ],
      totalBidQty: 8800,
      totalAskQty: 9050,
    },
  },
  "SENSEX": {
    symbol: "SENSEX",
    name: "BSE Sensex",
    exchange: "BSE",
    currency: "INR",
    price: 81340.5,
    previousClose: 80980.0,
    change: 360.5,
    changePercent: 0.44,
    dayHigh: 81480.0,
    dayLow: 80890.0,
    open: 81020.0,
    volume: 9800000,
    vwap: 81210.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [80980, 81050, 81120, 81250, 81340.5],
    depth: {
      bids: [
        { price: 81338.0, quantity: 210, orders: 8 },
        { price: 81335.0, quantity: 450, orders: 16 },
        { price: 81330.0, quantity: 900, orders: 28 },
        { price: 81320.0, quantity: 1500, orders: 42 },
        { price: 81300.0, quantity: 2800, orders: 60 },
      ],
      asks: [
        { price: 81342.0, quantity: 300, orders: 11 },
        { price: 81345.0, quantity: 650, orders: 21 },
        { price: 81350.0, quantity: 1100, orders: 35 },
        { price: 81360.0, quantity: 1900, orders: 48 },
        { price: 81380.0, quantity: 3200, orders: 75 },
      ],
      totalBidQty: 5860,
      totalAskQty: 7150,
    },
  },
  "RELIANCE": {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    exchange: "NSE",
    currency: "INR",
    price: 3015.0,
    previousClose: 3025.5,
    change: -10.5,
    changePercent: -0.35,
    dayHigh: 3042.0,
    dayLow: 3008.0,
    open: 3028.0,
    volume: 4250000,
    vwap: 3022.4,
    lastTickDirection: "down",
    lastUpdated: Date.now(),
    tickHistory: [3025.5, 3028, 3035, 3020, 3015],
    depth: {
      bids: [
        { price: 3014.8, quantity: 1200, orders: 24 },
        { price: 3014.5, quantity: 3500, orders: 62 },
        { price: 3014.0, quantity: 5100, orders: 89 },
        { price: 3013.0, quantity: 8200, orders: 130 },
        { price: 3012.0, quantity: 12400, orders: 190 },
      ],
      asks: [
        { price: 3015.2, quantity: 1800, orders: 31 },
        { price: 3015.5, quantity: 4100, orders: 74 },
        { price: 3016.0, quantity: 6800, orders: 105 },
        { price: 3017.0, quantity: 9500, orders: 142 },
        { price: 3018.0, quantity: 14200, orders: 210 },
      ],
      totalBidQty: 30400,
      totalAskQty: 36400,
    },
  },
  "TCS": {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    exchange: "NSE",
    currency: "INR",
    price: 4520.4,
    previousClose: 4460.0,
    change: 60.4,
    changePercent: 1.35,
    dayHigh: 4538.0,
    dayLow: 4455.0,
    open: 4470.0,
    volume: 2150000,
    vwap: 4505.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [4460, 4475, 4490, 4510, 4520.4],
    depth: {
      bids: [
        { price: 4520.0, quantity: 800, orders: 15 },
        { price: 4519.0, quantity: 1500, orders: 28 },
        { price: 4518.0, quantity: 2400, orders: 45 },
        { price: 4515.0, quantity: 4100, orders: 68 },
        { price: 4510.0, quantity: 6500, orders: 110 },
      ],
      asks: [
        { price: 4520.8, quantity: 950, orders: 19 },
        { price: 4521.5, quantity: 1800, orders: 33 },
        { price: 4523.0, quantity: 2900, orders: 52 },
        { price: 4525.0, quantity: 4800, orders: 84 },
        { price: 4530.0, quantity: 7200, orders: 125 },
      ],
      totalBidQty: 15300,
      totalAskQty: 17650,
    },
  },
  "HDFCBANK": {
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    exchange: "NSE",
    currency: "INR",
    price: 1648.2,
    previousClose: 1635.0,
    change: 13.2,
    changePercent: 0.81,
    dayHigh: 1654.0,
    dayLow: 1630.0,
    open: 1636.0,
    volume: 6800000,
    vwap: 1642.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [1635, 1638, 1642, 1645, 1648.2],
    depth: {
      bids: [
        { price: 1648.0, quantity: 4200, orders: 55 },
        { price: 1647.5, quantity: 8500, orders: 98 },
        { price: 1647.0, quantity: 12000, orders: 140 },
        { price: 1646.0, quantity: 18500, orders: 210 },
        { price: 1645.0, quantity: 26000, orders: 310 },
      ],
      asks: [
        { price: 1648.4, quantity: 3800, orders: 48 },
        { price: 1648.8, quantity: 7900, orders: 85 },
        { price: 1649.5, quantity: 11500, orders: 130 },
        { price: 1650.0, quantity: 22000, orders: 260 },
        { price: 1652.0, quantity: 29000, orders: 350 },
      ],
      totalBidQty: 69200,
      totalAskQty: 74200,
    },
  },
  "INFY": {
    symbol: "INFY",
    name: "Infosys Limited",
    exchange: "NSE",
    currency: "INR",
    price: 1862.5,
    previousClose: 1840.0,
    change: 22.5,
    changePercent: 1.22,
    dayHigh: 1870.0,
    dayLow: 1835.0,
    open: 1845.0,
    volume: 3400000,
    vwap: 1855.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [1840, 1846, 1852, 1858, 1862.5],
    depth: {
      bids: [
        { price: 1862.0, quantity: 2100, orders: 32 },
        { price: 1861.5, quantity: 4800, orders: 67 },
        { price: 1861.0, quantity: 7500, orders: 95 },
        { price: 1860.0, quantity: 11200, orders: 145 },
        { price: 1858.0, quantity: 16500, orders: 205 },
      ],
      asks: [
        { price: 1862.8, quantity: 2400, orders: 36 },
        { price: 1863.5, quantity: 5100, orders: 71 },
        { price: 1864.0, quantity: 8200, orders: 104 },
        { price: 1865.0, quantity: 13500, orders: 172 },
        { price: 1868.0, quantity: 18200, orders: 230 },
      ],
      totalBidQty: 42100,
      totalAskQty: 47400,
    },
  },
  "ICICIBANK": {
    symbol: "ICICIBANK",
    name: "ICICI Bank Limited",
    exchange: "NSE",
    currency: "INR",
    price: 1224.8,
    previousClose: 1215.0,
    change: 9.8,
    changePercent: 0.81,
    dayHigh: 1230.0,
    dayLow: 1210.0,
    open: 1216.0,
    volume: 5100000,
    vwap: 1220.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [1215, 1218, 1220, 1222, 1224.8],
    depth: {
      bids: [
        { price: 1224.5, quantity: 3100, orders: 42 },
        { price: 1224.0, quantity: 6400, orders: 78 },
        { price: 1223.5, quantity: 9800, orders: 115 },
        { price: 1222.0, quantity: 14200, orders: 165 },
        { price: 1220.0, quantity: 21000, orders: 240 },
      ],
      asks: [
        { price: 1225.0, quantity: 3600, orders: 49 },
        { price: 1225.5, quantity: 7200, orders: 88 },
        { price: 1226.0, quantity: 10500, orders: 128 },
        { price: 1227.0, quantity: 15800, orders: 182 },
        { price: 1230.0, quantity: 24500, orders: 290 },
      ],
      totalBidQty: 54500,
      totalAskQty: 61600,
    },
  },
  "GOLD": {
    symbol: "GOLD",
    name: "Gold Spot (MCX / Oz)",
    exchange: "MCX",
    currency: "USD",
    price: 2514.8,
    previousClose: 2498.0,
    change: 16.8,
    changePercent: 0.67,
    dayHigh: 2520.0,
    dayLow: 2492.0,
    open: 2496.0,
    volume: 85000,
    vwap: 2508.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [2498, 2502, 2507, 2511, 2514.8],
    depth: {
      bids: [
        { price: 2514.5, quantity: 45, orders: 5 },
        { price: 2514.0, quantity: 110, orders: 12 },
        { price: 2513.5, quantity: 180, orders: 19 },
        { price: 2512.0, quantity: 310, orders: 28 },
        { price: 2510.0, quantity: 520, orders: 44 },
      ],
      asks: [
        { price: 2515.0, quantity: 60, orders: 7 },
        { price: 2515.5, quantity: 125, orders: 14 },
        { price: 2516.0, quantity: 210, orders: 22 },
        { price: 2518.0, quantity: 380, orders: 35 },
        { price: 2520.0, quantity: 650, orders: 58 },
      ],
      totalBidQty: 1165,
      totalAskQty: 1425,
    },
  },
  "BTC/USD": {
    symbol: "BTC/USD",
    name: "Bitcoin",
    exchange: "CRYPTO",
    currency: "USD",
    price: 64820.0,
    previousClose: 63400.0,
    change: 1420.0,
    changePercent: 2.24,
    dayHigh: 65100.0,
    dayLow: 63150.0,
    open: 63450.0,
    volume: 24150,
    vwap: 64200.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [63400, 63750, 64100, 64500, 64820.0],
    depth: {
      bids: [
        { price: 64818.0, quantity: 2.45, orders: 6 },
        { price: 64815.0, quantity: 5.82, orders: 14 },
        { price: 64810.0, quantity: 11.4, orders: 25 },
        { price: 64800.0, quantity: 24.1, orders: 48 },
        { price: 64750.0, quantity: 52.8, orders: 85 },
      ],
      asks: [
        { price: 64822.0, quantity: 3.12, orders: 8 },
        { price: 64825.0, quantity: 6.45, orders: 16 },
        { price: 64830.0, quantity: 12.8, orders: 29 },
        { price: 64850.0, quantity: 28.5, orders: 54 },
        { price: 64900.0, quantity: 61.2, orders: 98 },
      ],
      totalBidQty: 96.57,
      totalAskQty: 112.07,
    },
  },
  "ETH/USD": {
    symbol: "ETH/USD",
    name: "Ethereum",
    exchange: "CRYPTO",
    currency: "USD",
    price: 3492.5,
    previousClose: 3510.0,
    change: -17.5,
    changePercent: -0.5,
    dayHigh: 3540.0,
    dayLow: 3465.0,
    open: 3505.0,
    volume: 185400,
    vwap: 3495.0,
    lastTickDirection: "down",
    lastUpdated: Date.now(),
    tickHistory: [3510, 3505, 3485, 3495, 3492.5],
    depth: {
      bids: [
        { price: 3492.0, quantity: 18.5, orders: 8 },
        { price: 3491.0, quantity: 42.0, orders: 19 },
        { price: 3490.0, quantity: 85.0, orders: 34 },
        { price: 3488.0, quantity: 160.0, orders: 62 },
        { price: 3485.0, quantity: 320.0, orders: 110 },
      ],
      asks: [
        { price: 3493.0, quantity: 22.0, orders: 10 },
        { price: 3494.0, quantity: 48.5, orders: 22 },
        { price: 3495.0, quantity: 96.0, orders: 41 },
        { price: 3498.0, quantity: 185.0, orders: 75 },
        { price: 3500.0, quantity: 380.0, orders: 135 },
      ],
      totalBidQty: 625.5,
      totalAskQty: 731.5,
    },
  },
  "S&P 500": {
    symbol: "S&P 500",
    name: "S&P 500 Index",
    exchange: "NYSE",
    currency: "USD",
    price: 5652.8,
    previousClose: 5610.0,
    change: 42.8,
    changePercent: 0.76,
    dayHigh: 5665.0,
    dayLow: 5602.0,
    open: 5615.0,
    volume: 28500000,
    vwap: 5640.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [5610, 5622, 5635, 5648, 5652.8],
    depth: {
      bids: [
        { price: 5652.5, quantity: 250, orders: 9 },
        { price: 5651.0, quantity: 600, orders: 21 },
        { price: 5650.0, quantity: 1200, orders: 40 },
        { price: 5648.0, quantity: 2100, orders: 65 },
        { price: 5645.0, quantity: 3800, orders: 95 },
      ],
      asks: [
        { price: 5653.0, quantity: 300, orders: 12 },
        { price: 5654.5, quantity: 720, orders: 25 },
        { price: 5656.0, quantity: 1400, orders: 47 },
        { price: 5658.0, quantity: 2400, orders: 74 },
        { price: 5660.0, quantity: 4200, orders: 110 },
      ],
      totalBidQty: 7950,
      totalAskQty: 9020,
    },
  },
  "NASDAQ": {
    symbol: "NASDAQ",
    name: "Nasdaq 100",
    exchange: "NASDAQ",
    currency: "USD",
    price: 17925.6,
    previousClose: 17720.0,
    change: 205.6,
    changePercent: 1.16,
    dayHigh: 17960.0,
    dayLow: 17690.0,
    open: 17740.0,
    volume: 34100000,
    vwap: 17880.0,
    lastTickDirection: "up",
    lastUpdated: Date.now(),
    tickHistory: [17720, 17780, 17840, 17890, 17925.6],
    depth: {
      bids: [
        { price: 17925.0, quantity: 180, orders: 8 },
        { price: 17924.0, quantity: 450, orders: 18 },
        { price: 17922.0, quantity: 920, orders: 32 },
        { price: 17920.0, quantity: 1650, orders: 55 },
        { price: 17915.0, quantity: 2900, orders: 85 },
      ],
      asks: [
        { price: 17926.0, quantity: 220, orders: 10 },
        { price: 17927.5, quantity: 540, orders: 22 },
        { price: 17930.0, quantity: 1100, orders: 39 },
        { price: 17935.0, quantity: 1950, orders: 63 },
        { price: 17940.0, quantity: 3400, orders: 98 },
      ],
      totalBidQty: 6100,
      totalAskQty: 7210,
    },
  },
  "USD/INR": {
    symbol: "USD/INR",
    name: "US Dollar / Indian Rupee",
    exchange: "FX",
    currency: "INR",
    price: 83.92,
    previousClose: 83.95,
    change: -0.03,
    changePercent: -0.04,
    dayHigh: 83.98,
    dayLow: 83.89,
    open: 83.94,
    volume: 12500000,
    vwap: 83.93,
    lastTickDirection: "down",
    lastUpdated: Date.now(),
    tickHistory: [83.95, 83.94, 83.93, 83.92],
    depth: {
      bids: [
        { price: 83.918, quantity: 150000, orders: 15 },
        { price: 83.915, quantity: 350000, orders: 32 },
        { price: 83.910, quantity: 600000, orders: 55 },
        { price: 83.905, quantity: 1200000, orders: 85 },
        { price: 83.900, quantity: 2500000, orders: 140 },
      ],
      asks: [
        { price: 83.922, quantity: 180000, orders: 18 },
        { price: 83.925, quantity: 420000, orders: 38 },
        { price: 83.930, quantity: 750000, orders: 62 },
        { price: 83.935, quantity: 1400000, orders: 95 },
        { price: 83.940, quantity: 2900000, orders: 160 },
      ],
      totalBidQty: 4800000,
      totalAskQty: 5650000,
    },
  },
};

class RealTimeMarketService {
  private instruments: Record<string, LiveInstrument> = { ...INITIAL_INSTRUMENTS };
  private subscribers: Set<MarketTickCallback> = new Set();
  private intervalId: any = null;
  private isStreaming = false;

  constructor() {
    this.startStreaming();
  }

  public getInstruments(): Record<string, LiveInstrument> {
    return this.instruments;
  }

  public getInstrument(symbol: string): LiveInstrument | null {
    const key = symbol.toUpperCase().trim();
    return this.instruments[key] || null;
  }

  public subscribe(cb: MarketTickCallback): () => void {
    this.subscribers.add(cb);
    cb(this.instruments); // Immediate initial callback
    return () => {
      this.subscribers.delete(cb);
    };
  }

  public startStreaming(tickIntervalMs = 2000) {
    if (this.isStreaming) return;
    this.isStreaming = true;

    this.intervalId = setInterval(() => {
      this.generateMarketTick();
    }, tickIntervalMs);
  }

  public stopStreaming() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isStreaming = false;
  }

  /**
   * Generates realistic stochastic market micro-ticks matching exchange tick sizes
   */
  public generateMarketTick() {
    const keys = Object.keys(this.instruments);
    if (keys.length === 0) return;

    // Pick 2 to 4 instruments to tick simultaneously for high visual dynamism
    const numToTick = Math.floor(Math.random() * 3) + 2;
    const shuffled = [...keys].sort(() => 0.5 - Math.random());
    const targetKeys = shuffled.slice(0, numToTick);

    targetKeys.forEach((key) => {
      const inst = this.instruments[key];
      if (!inst) return;

      // Realistic tick delta between -0.35% and +0.35%
      const volatility = inst.exchange === "CRYPTO" ? 0.006 : 0.0018;
      const pctDelta = (Math.random() * 2 - 0.98) * volatility;
      const rawNewPrice = inst.price * (1 + pctDelta);

      // Round to proper exchange precision (0.05 on NSE, 0.01 for USD)
      const tickSize = inst.currency === "INR" && inst.price > 500 ? 0.05 : 0.01;
      const roundedPrice = Math.round(rawNewPrice / tickSize) * tickSize;
      const newPrice = Number(roundedPrice.toFixed(inst.currency === "INR" && inst.price > 1000 ? 2 : 2));

      const direction: "up" | "down" | "flat" =
        newPrice > inst.price ? "up" : newPrice < inst.price ? "down" : "flat";

      const change = Number((newPrice - inst.previousClose).toFixed(2));
      const changePercent = Number(((change / inst.previousClose) * 100).toFixed(2));
      const dayHigh = Math.max(inst.dayHigh, newPrice);
      const dayLow = Math.min(inst.dayLow, newPrice);
      const addedVolume = Math.floor(Math.random() * 500) + 50;

      // Update depth entries realistically
      const spread = (inst.price * 0.0004);
      const newDepth: MarketDepthEntry = {
        bids: inst.depth.bids.map((b, i) => ({
          price: Number((newPrice - spread * (i + 1)).toFixed(2)),
          quantity: Math.max(10, Math.round(b.quantity * (0.95 + Math.random() * 0.1))),
          orders: Math.max(1, Math.round(b.orders * (0.95 + Math.random() * 0.1))),
        })),
        asks: inst.depth.asks.map((a, i) => ({
          price: Number((newPrice + spread * (i + 1)).toFixed(2)),
          quantity: Math.max(10, Math.round(a.quantity * (0.95 + Math.random() * 0.1))),
          orders: Math.max(1, Math.round(a.orders * (0.95 + Math.random() * 0.1))),
        })),
        totalBidQty: 0,
        totalAskQty: 0,
      };
      newDepth.totalBidQty = newDepth.bids.reduce((sum, b) => sum + b.quantity, 0);
      newDepth.totalAskQty = newDepth.asks.reduce((sum, a) => sum + a.quantity, 0);

      const history = [...inst.tickHistory, newPrice].slice(-30);

      this.instruments[key] = {
        ...inst,
        price: newPrice,
        change,
        changePercent,
        dayHigh,
        dayLow,
        volume: inst.volume + addedVolume,
        lastTickDirection: direction,
        lastUpdated: Date.now(),
        tickHistory: history,
        depth: newDepth,
      };
    });

    // Notify all active subscribers
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach((cb) => {
      try {
        cb(this.instruments);
      } catch (err) {
        console.error("Error in market subscriber callback:", err);
      }
    });
  }

  public triggerManualSync() {
    this.generateMarketTick();
  }
}

export const realTimeMarket = new RealTimeMarketService();
