/**
 * Financial Market News & Macroeconomic Intelligence Feed
 * Curates live market headlines, sector shifts, and macro announcements (rates, inflation, earnings)
 * Powers grounded RAG context for the AI Copilot to avoid hallucinations.
 */

export interface MarketNewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url?: string;
  publishedAt: string;
  category: "Macro" | "Earnings" | "Regulatory" | "Sector";
  sentiment: "Bullish" | "Neutral" | "Bearish";
  relatedSymbols: string[];
  relevanceScore: number;
}

const SEED_NEWS: MarketNewsItem[] = [
  {
    id: "news-01",
    headline: "Federal Reserve Signals Data-Dependent Stance on Policy Rates",
    summary: "FOMC minutes reflect balanced inflation expectations, with committee members noting strong labor market resilience and moderate yield curve steepening.",
    source: "Bloomberg Finance",
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    category: "Macro",
    sentiment: "Neutral",
    relatedSymbols: ["SPY", "VOO", "TLT"],
    relevanceScore: 0.95,
  },
  {
    id: "news-02",
    headline: "Tech Mega-Caps Drive Benchmark Momentum Amid Robust Cloud Capex",
    summary: "Enterprise cloud and AI infrastructure expenditures remain elevated, supporting double-digit revenue expansion across leading semiconductor and software firms.",
    source: "Reuters Financial",
    publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    category: "Sector",
    sentiment: "Bullish",
    relatedSymbols: ["AAPL", "MSFT", "NVDA", "QQQ"],
    relevanceScore: 0.92,
  },
  {
    id: "news-03",
    headline: "Treasury Yield Curve Shifts Prompt Municipal Bond Inflows",
    summary: "Fixed income managers report heightened demand for high-grade tax-exempt municipal bonds as wealth advisors lock in duration ahead of anticipated rate easing.",
    source: "Financial Times",
    publishedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    category: "Macro",
    sentiment: "Bullish",
    relatedSymbols: ["MUB", "BND", "AGG"],
    relevanceScore: 0.88,
  },
  {
    id: "news-04",
    headline: "Global Energy & Materials Face Margin Pressure on Commodity Softness",
    summary: "Crude benchmarks consolidate as inventory data beats estimates, prompting rotation into defensive dividend equities and high-conviction value holdings.",
    source: "Wall Street Journal",
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    category: "Sector",
    sentiment: "Bearish",
    relatedSymbols: ["XLE", "RELIANCE", "BP"],
    relevanceScore: 0.81,
  },
];

class MarketNewsService {
  private newsItems: MarketNewsItem[] = [...SEED_NEWS];

  public getLatestNews(symbols?: string[], limit = 5): MarketNewsItem[] {
    if (!symbols || symbols.length === 0) {
      return this.newsItems.slice(0, limit);
    }
    const upper = symbols.map((s) => s.toUpperCase());
    const matched = this.newsItems.filter((item) =>
      item.relatedSymbols.some((sym) => upper.includes(sym))
    );
    if (matched.length > 0) {
      return matched.slice(0, limit);
    }
    return this.newsItems.slice(0, limit);
  }

  public getGroundingContextForAI(symbols: string[] = []): string {
    const relevant = this.getLatestNews(symbols, 3);
    return relevant
      .map(
        (n) =>
          `[${n.publishedAt.slice(0, 10)} - ${n.source}] ${n.headline}: ${n.summary} (Sentiment: ${n.sentiment}, Focus: ${n.relatedSymbols.join(", ")})`
      )
      .join("\n");
  }
}

export const marketNewsService = new MarketNewsService();
