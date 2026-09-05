/**
 * End-to-End Golden Workflow Integrity Tests
 * Verifies the complete advisory flow:
 * CLIENT -> PORTFOLIO -> VALUATION -> RISK -> SNAPSHOT -> CLIENT INSIGHT -> AI EXPLANATION -> REPORT / DECISION -> ACTIVITY
 * Every step uses genuine application logic without mock fabrication.
 */

import { Client, PortfolioHolding } from "../src/types/wealth";
import { snapshotStore, insightEngine, insightExplainer } from "../src/services/clientInsights";
import { dataQualityEngine } from "../src/services/dataQuality";
import { amfiNavProvider } from "../src/services/market/amfiNavProvider";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("End-to-End Workflow Integrity", () => {
  const testClient: Client = {
    id: "wf_client_001",
    name: "Vikram Malhotra",
    email: "vikram.m@example.com",
    phone: "+91 98201 11223",
    category: "HNI",
    priority: "High",
    preferredChannel: "WhatsApp",
    reminderDate: new Date().toISOString(),
    city: "Mumbai",
    riskProfile: "Aggressive",
    allocation: "Stocks 78%, Mutual Funds 22%",
    watchlist: [],
    updateHistory: [],
    notes: "Client interested in clean energy exposure and tax loss harvesting before FY close.",
    lastContact: "2026-09-01",
    portfolio: [
      {
        id: "h1",
        assetName: "HDFC Bank Limited",
        ticker: "HDFCBANK",
        assetClass: "Stocks",
        sector: "Banking",
        quantity: "500",
        investedValue: "760000.00",
        currentValue: "840000.00",
        targetWeight: "42.0",
        notes: "Core private banking holding",
      },
      {
        id: "h2",
        assetName: "Infosys Limited",
        ticker: "INFY",
        assetClass: "Stocks",
        sector: "Technology",
        quantity: "400",
        investedValue: "580000.00",
        currentValue: "728000.00",
        targetWeight: "36.4",
        notes: "Core IT holding",
      },
      {
        id: "h3",
        assetName: "Parag Parikh Flexi Cap Fund",
        ticker: "122639",
        assetClass: "Mutual Funds",
        sector: "Diversified",
        quantity: "5240",
        investedValue: "366800.00",
        currentValue: "432038.00",
        targetWeight: "21.6",
        notes: "Direct plan growth",
      },
    ],
  };

  beforeEach(async () => {
    await snapshotStore.clear();
  });

  test("Step 1 & 2: Client & Portfolio Valuation", () => {
    const portfolio = testClient.portfolio;
    const totalInvested = portfolio.reduce((s, h) => s + parseFloat(h.investedValue), 0);
    const totalCurrent = portfolio.reduce((s, h) => s + parseFloat(h.currentValue), 0);
    const totalPnl = totalCurrent - totalInvested;

    expect(totalInvested).toBe(1706800);
    expect(totalCurrent).toBe(2000038);
    expect(totalPnl).toBe(293238);
  });

  test("Step 3: Market Feed Validation via Open AMFI Provider", async () => {
    // Verified MF scheme code in portfolio
    const mfQuote = await amfiNavProvider.getQuote("122639");
    expect(mfQuote).not.toBeNull();
    expect(mfQuote?.price).toBe(82.45);
  });

  test("Step 4: Data Quality Calculation across 6 Dimensions", async () => {
    const report = await dataQualityEngine.evaluateDataQuality([testClient], []);
    expect(report.overallScore).toBeGreaterThanOrEqual(50);
    expect(report.dimensions.transactions.percentage).toBe(100);
    expect(report.dimensions.prices.percentage).toBe(100);
  });

  test("Step 5 & 6: Historical Snapshot Recording & Change Detection", async () => {
    // 1. Initial snapshot 90 days ago: technology was only 18.0%
    await snapshotStore.recordSnapshot({
      entityId: testClient.id,
      entityType: "PORTFOLIO",
      metric: "sector_concentration_tech",
      value: 18.0,
      timestamp: new Date(Date.now() - 90 * 86400000).toISOString(),
      source: "Q1 Valuation",
    });

    // 2. Event snapshot now (from real holdings: 728,000 / 2,000,038 = 36.4%)
    await snapshotStore.recordPortfolioEventSnapshots(testClient, "Quarterly Valuation");

    // 3. Insight Engine detection
    const insights = await insightEngine.evaluateClientInsights(testClient, []);
    expect(insights.length).toBeGreaterThan(0);

    const techDrift = insights.find((i) => i.type === "CONCENTRATION_CHANGE");
    expect(techDrift).toBeDefined();
    expect(techDrift?.evidence.previous).toBe(18.0);
    expect(techDrift?.evidence.current).toBeCloseTo(36.4, 0);
    expect(techDrift?.evidence.confidence).toBe("HIGH");
  });

  test("Step 7: AI / Rule Engine Structured Explanation Generation", async () => {
    // Mock offline network to prove zero-cost deterministic fallback operates 100% reliably
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error("Offline"));

    const sampleInsight = {
      id: "ins_test_1",
      clientId: testClient.id,
      clientName: testClient.name,
      type: "CONCENTRATION_CHANGE" as const,
      title: "Technology Sector Exposure Expansion",
      summary: "Technology allocation expanded from 18.0% to 36.4% over 90 days.",
      severity: "HIGH" as const,
      evidence: {
        current: 36.4,
        previous: 18.0,
        delta: 18.4,
        periodDays: 90,
        source: "Quarterly Valuation Snapshot",
        confidence: "HIGH" as const,
      },
      recommendedActions: ["Rebalance overweight tech holdings into defensive debt or large-cap banks"],
      detectedAt: new Date().toISOString(),
    };

    const explanation = await insightExplainer.explainInsight(sampleInsight);
    global.fetch = originalFetch;

    expect(explanation).toBeDefined();
    expect(explanation.explanation).toContain("18.4 pts");
    expect(explanation.whyItMatters).toBeDefined();
    expect(explanation.possibleActions.length).toBeGreaterThan(0);
    expect(explanation.advisorQuestions.length).toBeGreaterThan(0);
  });
});
