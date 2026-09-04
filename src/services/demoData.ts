export interface PortfolioHolding {
  id: string;
  assetName: string;
  assetClass: "Stocks" | "Bonds" | "Mutual Funds" | "Cash" | "Alternatives";
  ticker: string;
  quantity: string;
  investedValue: string;
  currentValue: string;
  targetWeight: string;
  notes: string;
}

export interface DemoClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: "HNI" | "Retail" | "Family Office" | "Trader" | "Long Term";
  riskProfile: string;
  preferredChannel: "Phone" | "SMS" | "Email" | "WhatsApp";
  watchlist: string[];
  notes: string;
  city: string;
  allocation: string;
  reminderDate: string;
  priority: "High" | "Medium" | "Low";
  lastContact: string;
  updateHistory: string[];
  portfolio: PortfolioHolding[];
}

export const DEMO_CLIENTS: DemoClient[] = [
  {
    id: "demo-client-1",
    name: "Sophia Chen",
    phone: "+1 (415) 890-2341",
    email: "sophia.chen@chenventures.com",
    category: "Family Office",
    riskProfile: "Aggressive Growth • High Tech Conviction",
    preferredChannel: "WhatsApp",
    watchlist: ["NVDA", "AAPL", "MSFT", "TSLA", "GLD"],
    notes: "Principal of Chen Ventures. Seeking $1.2M rebalance into fixed income ahead of Q3 liquidity event.",
    city: "San Francisco, CA",
    allocation: "Stocks 65%, Bonds 15%, Alternatives 12%, Cash 8%",
    reminderDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    priority: "High",
    lastContact: "Yesterday",
    updateHistory: [
      "Reviewed Q2 tech distribution report.",
      "Discussed private credit diversification options.",
      "Scheduled bi-annual fiduciary audit."
    ],
    portfolio: [
      {
        id: "hold-1",
        assetName: "NVIDIA Corporation",
        assetClass: "Stocks",
        ticker: "NVDA",
        quantity: "1500",
        investedValue: "180000",
        currentValue: "205500",
        targetWeight: "35%",
        notes: "Core AI accelerator position."
      },
      {
        id: "hold-2",
        assetName: "Apple Inc.",
        assetClass: "Stocks",
        ticker: "AAPL",
        quantity: "800",
        investedValue: "140000",
        currentValue: "182400",
        targetWeight: "30%",
        notes: "Cash compounder & ecosystem moat."
      },
      {
        id: "hold-3",
        assetName: "US Treasury 10Y Note",
        assetClass: "Bonds",
        ticker: "US10Y",
        quantity: "100",
        investedValue: "100000",
        currentValue: "98500",
        targetWeight: "15%",
        notes: "Duration hedge & yield anchor."
      },
      {
        id: "hold-4",
        assetName: "SPDR Gold Shares",
        assetClass: "Alternatives",
        ticker: "GLD",
        quantity: "350",
        investedValue: "65000",
        currentValue: "78200",
        targetWeight: "12%",
        notes: "Geopolitical risk & inflation hedge."
      },
      {
        id: "hold-5",
        assetName: "US Dollar Liquidity Reserve",
        assetClass: "Cash",
        ticker: "USD",
        quantity: "50000",
        investedValue: "50000",
        currentValue: "50000",
        targetWeight: "8%",
        notes: "Ready capital for private market co-invest."
      }
    ]
  },
  {
    id: "demo-client-2",
    name: "Marcus Vance",
    phone: "+1 (212) 555-0192",
    email: "marcus.vance@vanceholdings.org",
    category: "HNI",
    riskProfile: "Balanced Wealth Preservation",
    preferredChannel: "Email",
    watchlist: ["SPY", "BND", "BRK.B", "JNJ", "VNQ"],
    notes: "Retired corporate executive. Goal is steady 5.5% net distribution to fund charitable endowment.",
    city: "New York, NY",
    allocation: "Stocks 45%, Bonds 40%, Mutual Funds 10%, Cash 5%",
    reminderDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    priority: "Medium",
    lastContact: "3 days ago",
    updateHistory: [
      "Generated annual tax-loss harvesting brief.",
      "Transferred municipal bond interest to liquidity account."
    ],
    portfolio: [
      {
        id: "hold-6",
        assetName: "Vanguard Total Stock Market",
        assetClass: "Mutual Funds",
        ticker: "VTI",
        quantity: "2200",
        investedValue: "450000",
        currentValue: "542000",
        targetWeight: "45%",
        notes: "Broad market passive equity exposure."
      },
      {
        id: "hold-7",
        assetName: "Vanguard Total Bond Market",
        assetClass: "Bonds",
        ticker: "BND",
        quantity: "5000",
        investedValue: "380000",
        currentValue: "368000",
        targetWeight: "40%",
        notes: "Defensive capital preservation layer."
      },
      {
        id: "hold-8",
        assetName: "Johnson & Johnson",
        assetClass: "Stocks",
        ticker: "JNJ",
        quantity: "600",
        investedValue: "95000",
        currentValue: "97800",
        targetWeight: "10%",
        notes: "Defensive dividend growth aristocrat."
      },
      {
        id: "hold-9",
        assetName: "High Yield Sweep Account",
        assetClass: "Cash",
        ticker: "CASH",
        quantity: "50000",
        investedValue: "50000",
        currentValue: "50000",
        targetWeight: "5%",
        notes: "6-month operational expense buffer."
      }
    ]
  },
  {
    id: "demo-client-3",
    name: "Elena Rostova",
    phone: "+44 20 7946 0912",
    email: "elena.rostova@genevacap.ch",
    category: "Long Term",
    riskProfile: "Conservative Global Compounder",
    preferredChannel: "WhatsApp",
    watchlist: ["MSFT", "GOOGL", "QQQ", "TLT"],
    notes: "Multinational biotech director. Quarterly dollar-cost averaging into automated ESG equity indices.",
    city: "London / Geneva",
    allocation: "Stocks 50%, Bonds 30%, Alternatives 15%, Cash 5%",
    reminderDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    priority: "High",
    lastContact: "1 week ago",
    updateHistory: [
      "Automated monthly SIP executed ($15,000).",
      "Sent currency hedge exposure summary."
    ],
    portfolio: [
      {
        id: "hold-10",
        assetName: "Microsoft Corporation",
        assetClass: "Stocks",
        ticker: "MSFT",
        quantity: "750",
        investedValue: "260000",
        currentValue: "332000",
        targetWeight: "50%",
        notes: "Enterprise cloud & Copilot market leader."
      },
      {
        id: "hold-11",
        assetName: "iShares 20+ Year Treasury",
        assetClass: "Bonds",
        ticker: "TLT",
        quantity: "2000",
        investedValue: "190000",
        currentValue: "185000",
        targetWeight: "30%",
        notes: "Long duration rate stabilization asset."
      },
      {
        id: "hold-12",
        assetName: "Global Infrastructure Fund",
        assetClass: "Alternatives",
        ticker: "IGF",
        quantity: "1500",
        investedValue: "70000",
        currentValue: "76500",
        targetWeight: "15%",
        notes: "Real asset inflation-linked cash flows."
      }
    ]
  }
];
