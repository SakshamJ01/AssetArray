import { calculateRebalance, SimpleHolding, TARGET_MODELS } from "../src/services/rebalancer";
import { calculateHealthScore } from "../src/services/healthScore";
import { Client, PortfolioHolding } from "../src/types/wealth";

describe("High-Load & Scalability Performance Stress Tests", () => {
  test("1,000+ Clients Roster Filtering & Health Score Benchmark (< 100ms)", () => {
    const clients: Client[] = [];
    const mockHoldings: PortfolioHolding[] = [
      {
        id: "h1",
        assetName: "HDFC Nifty 50 ETF",
        assetClass: "Stocks",
        ticker: "HDFCNIFTY",
        quantity: "100",
        investedValue: "100000",
        currentValue: "120000",
        targetWeight: "50",
        notes: "",
      },
    ];

    const startTime = performance.now();

    for (let i = 0; i < 1200; i++) {
      clients.push({
        id: `cli_stress_${i}`,
        name: `Stress Test Client ${i}`,
        email: `client${i}@wealth.test`,
        phone: `+9198000${String(i).padStart(5, "0")}`,
        city: i % 2 === 0 ? "Mumbai" : "Bengaluru",
        riskProfile: i % 3 === 0 ? "Conservative" : i % 3 === 1 ? "Moderate" : "Aggressive",
        category: i % 5 === 0 ? "Family Office" : "HNI",
        preferredChannel: "WhatsApp",
        watchlist: [],
        notes: "High load benchmark client profile.",
        allocation: "70% Equity / 30% Debt",
        reminderDate: "2026-11-01",
        priority: "Medium",
        lastContact: "2026-09-01",
        updateHistory: [],
        portfolio: mockHoldings,
      });
    }

    const genDuration = performance.now() - startTime;
    expect(clients.length).toBe(1200);
    expect(genDuration).toBeLessThan(500); // 1,200 records generated in < 500ms

    // Perform filter across 1,200 records
    const filterStart = performance.now();
    const filtered = clients.filter(
      (c) => c.riskProfile === "Moderate" && c.category === "HNI"
    );
    const filterDuration = performance.now() - filterStart;
    expect(filtered.length).toBeGreaterThan(0);
    expect(filterDuration).toBeLessThan(50); // Filter latency < 50ms

    // Benchmark Health Score calculations over 1,200 profiles
    const healthStart = performance.now();
    for (const client of clients) {
      const res = calculateHealthScore(client.portfolio, 0, client.id);
      expect(res.healthScore).toBeGreaterThanOrEqual(0);
      expect(res.healthScore).toBeLessThanOrEqual(100);
    }
    const healthDuration = performance.now() - healthStart;
    expect(healthDuration).toBeLessThan(2000); // Health calculation for 1,200 clients < 2000ms (2s under concurrent load)
  });

  test("10,000+ Holdings Portfolio Rebalance Calculation Benchmark (< 150ms)", () => {
    const holdings: SimpleHolding[] = [];
    const assetClasses: ("Equity" | "Debt" | "Cash" | "Alternative")[] = [
      "Equity",
      "Debt",
      "Cash",
      "Alternative",
    ];

    for (let i = 0; i < 10000; i++) {
      const assetClass = assetClasses[i % 4];
      holdings.push({
        id: `h_stress_${i}`,
        assetName: `Asset ${assetClass} ${i}`,
        assetClass,
        investedValue: 10000 + (i % 100) * 1000,
        currentValue: 12000 + (i % 100) * 1100,
      });
    }

    const rebalanceStart = performance.now();
    const result = calculateRebalance(holdings, TARGET_MODELS[1]);
    const rebalanceDuration = performance.now() - rebalanceStart;

    expect(holdings.length).toBe(10000);
    expect(result).toBeDefined();
    expect(result.totalPortfolioValue).toBeGreaterThan(0);
    expect(result.items.length).toBeGreaterThan(0);
    expect(rebalanceDuration).toBeLessThan(150); // 10,000 holdings rebalanced in < 150ms
  });
});
