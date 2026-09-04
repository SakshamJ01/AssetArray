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
};

let cachedQuotes: Record<string, MarketQuote> = { ...DEFAULT_QUOTES };
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 60_000;

export async function fetchLiveMarketQuotes(forceRefresh = false): Promise<Record<string, MarketQuote>> {
  const nowMs = Date.now();
  if (!forceRefresh && nowMs - lastFetchTimestamp < CACHE_TTL_MS && Object.keys(cachedQuotes).length > 0) {
    return cachedQuotes;
  }

  // Simulate live market fluctuation for realistic quotes
  const now = new Date().toISOString();
  const updated: Record<string, MarketQuote> = {};

  Object.entries(cachedQuotes).forEach(([symbol, item]) => {
    const randomDeltaPercent = (Math.random() * 2 - 0.9) * 0.5; // -0.45% to +0.55% fluctuation
    const newPrice = Math.max(1, Number((item.price * (1 + randomDeltaPercent / 100)).toFixed(2)));
    const newChange = Number((item.change24hPercent + randomDeltaPercent).toFixed(2));

    updated[symbol] = {
      ...item,
      price: newPrice,
      change24hPercent: newChange,
      lastUpdated: now,
    };
  });

  lastFetchTimestamp = nowMs;
  cachedQuotes = updated;
  return updated;
}

export function getQuoteForSymbol(symbol: string): MarketQuote | null {
  const upper = symbol.toUpperCase().trim();
  return cachedQuotes[upper] || null;
}
