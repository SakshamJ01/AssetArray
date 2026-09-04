import { realTimeMarket, LiveInstrument } from "./realTimeMarket";

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change24hPercent: number;
  lastUpdated: string;
  category: "Equity" | "Crypto" | "Mutual Fund" | "Fixed Income";
}

const DEFAULT_QUOTES: Record<string, MarketQuote> = {
  AAPL: { symbol: "AAPL", name: "Apple Inc.", price: 232.50, currency: "USD", change24hPercent: 1.45, lastUpdated: new Date().toISOString(), category: "Equity" },
  NVDA: { symbol: "NVDA", name: "NVIDIA Corp.", price: 128.80, currency: "USD", change24hPercent: 3.82, lastUpdated: new Date().toISOString(), category: "Equity" },
  MSFT: { symbol: "MSFT", name: "Microsoft Corp.", price: 448.20, currency: "USD", change24hPercent: 0.65, lastUpdated: new Date().toISOString(), category: "Equity" },
  BTC: { symbol: "BTC", name: "Bitcoin", price: 64250.00, currency: "USD", change24hPercent: 2.10, lastUpdated: new Date().toISOString(), category: "Crypto" },
  ETH: { symbol: "ETH", name: "Ethereum", price: 3480.00, currency: "USD", change24hPercent: -0.85, lastUpdated: new Date().toISOString(), category: "Crypto" },
  SOL: { symbol: "SOL", name: "Solana", price: 154.30, currency: "USD", change24hPercent: 5.12, lastUpdated: new Date().toISOString(), category: "Crypto" },
  VOO: { symbol: "VOO", name: "Vanguard S&P 500 ETF", price: 512.40, currency: "USD", change24hPercent: 0.78, lastUpdated: new Date().toISOString(), category: "Mutual Fund" },
  QQQ: { symbol: "QQQ", name: "Invesco QQQ Trust", price: 485.60, currency: "USD", change24hPercent: 1.22, lastUpdated: new Date().toISOString(), category: "Mutual Fund" },
  NIFTY50: { symbol: "NIFTY50", name: "Nifty 50 Index Fund", price: 24850.00, currency: "INR", change24hPercent: 0.42, lastUpdated: new Date().toISOString(), category: "Mutual Fund" },
  RELIANCE: { symbol: "RELIANCE", name: "Reliance Industries", price: 3015.00, currency: "INR", change24hPercent: -0.35, lastUpdated: new Date().toISOString(), category: "Equity" },
  INFY: { symbol: "INFY", name: "Infosys Ltd.", price: 1850.20, currency: "INR", change24hPercent: 1.15, lastUpdated: new Date().toISOString(), category: "Equity" },
  HDFCBANK: { symbol: "HDFCBANK", name: "HDFC Bank", price: 1640.00, currency: "INR", change24hPercent: 0.20, lastUpdated: new Date().toISOString(), category: "Equity" },
  TCS: { symbol: "TCS", name: "Tata Consultancy Services", price: 4520.40, currency: "INR", change24hPercent: 1.35, lastUpdated: new Date().toISOString(), category: "Equity" },
  ICICIBANK: { symbol: "ICICIBANK", name: "ICICI Bank Ltd", price: 1224.80, currency: "INR", change24hPercent: 0.81, lastUpdated: new Date().toISOString(), category: "Equity" },
};

let cachedQuotes: Record<string, MarketQuote> = { ...DEFAULT_QUOTES };

function instrumentToQuote(inst: LiveInstrument): MarketQuote {
  let cat: MarketQuote["category"] = "Equity";
  if (inst.exchange === "CRYPTO") cat = "Crypto";
  else if (inst.exchange === "FX" || inst.exchange === "MCX") cat = "Fixed Income";
  else if (inst.symbol.includes("NIFTY") || inst.symbol.includes("S&P") || inst.symbol.includes("NASDAQ")) cat = "Mutual Fund";

  return {
    symbol: inst.symbol,
    name: inst.name,
    price: inst.price,
    currency: inst.currency,
    change24hPercent: inst.changePercent,
    lastUpdated: new Date(inst.lastUpdated).toISOString(),
    category: cat,
  };
}

// Auto-sync cachedQuotes whenever realTimeMarket emits live ticks
realTimeMarket.subscribe((instruments) => {
  Object.values(instruments).forEach((inst) => {
    cachedQuotes[inst.symbol.toUpperCase()] = instrumentToQuote(inst);
    // Aliases
    if (inst.symbol === "NIFTY 50") cachedQuotes["NIFTY50"] = instrumentToQuote(inst);
    if (inst.symbol === "BTC/USD") cachedQuotes["BTC"] = instrumentToQuote(inst);
    if (inst.symbol === "ETH/USD") cachedQuotes["ETH"] = instrumentToQuote(inst);
  });
});

export async function fetchLiveMarketQuotes(forceRefresh = false): Promise<Record<string, MarketQuote>> {
  if (forceRefresh) {
    realTimeMarket.triggerManualSync();
  }
  return cachedQuotes;
}

export function getQuoteForSymbol(symbol: string): MarketQuote | null {
  const upper = symbol.toUpperCase().trim();
  const direct = realTimeMarket.getInstrument(upper);
  if (direct) {
    return instrumentToQuote(direct);
  }
  // Check common aliases
  if (upper === "NIFTY" || upper === "NIFTY50") {
    const nifty = realTimeMarket.getInstrument("NIFTY 50");
    if (nifty) return instrumentToQuote(nifty);
  }
  if (upper === "BTC") {
    const btc = realTimeMarket.getInstrument("BTC/USD");
    if (btc) return instrumentToQuote(btc);
  }
  if (upper === "ETH") {
    const eth = realTimeMarket.getInstrument("ETH/USD");
    if (eth) return instrumentToQuote(eth);
  }
  return cachedQuotes[upper] || null;
}

