import {
  snapshotStore,
  insightEngine,
  insightExplainer,
} from "../src/services/clientInsights";
import { Client } from "../src/types/wealth";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("Client Insight Engine & Historical Snapshots", () => {
  beforeEach(async () => {
    await snapshotStore.clear();
  });

  it("persists point-in-time snapshots and retrieves comparisons", async () => {
    const now = Date.now();
    const dayMs = 86400000;

    await snapshotStore.recordSnapshot({
      entityId: "client_1",
      entityType: "PORTFOLIO",
      metric: "sector_concentration_tech",
      value: 18.1,
      timestamp: new Date(now - 90 * dayMs).toISOString(),
      source: "Ledger 90D",
    });

    await snapshotStore.recordSnapshot({
      entityId: "client_1",
      entityType: "PORTFOLIO",
      metric: "sector_concentration_tech",
      value: 27.4,
      timestamp: new Date(now).toISOString(),
      source: "Live Calculation",
    });

    const comp = await snapshotStore.getHistoricalComparison(
      "client_1",
      "sector_concentration_tech",
      90
    );

    expect(comp).not.toBeNull();
    expect(comp?.current.value).toBe(27.4);
    expect(comp?.previous.value).toBe(18.1);
    expect(comp?.periodDays).toBeGreaterThanOrEqual(89);
  });

  it("detects CONCENTRATION_CHANGE when supported by stored history", async () => {
    const mockClient: Client = {
      id: "client_test",
      name: "Rahul Mehta",
      phone: "+91 98200 12345",
      email: "rahul@example.com",
      city: "Mumbai",
      category: "HNI",
      priority: "High",
      preferredChannel: "WhatsApp",
      reminderDate: new Date().toISOString(),
      notes: "",
      riskProfile: "Aggressive",
      allocation: "Stocks 70%, Bonds 20%, Cash 10%",
      watchlist: ["TCS", "INFY"],
      updateHistory: [],
      portfolio: [],
      lastContact: "",
    };

    // Seed snapshots with tech concentration jump from 18.1% to 27.4% (+9.3 pts) in demo mode
    mockClient.portfolio = [
      {
        id: "h1",
        ticker: "TCS",
        assetName: "Tata Consultancy Services",
        quantity: "100",
        investedValue: "300000",
        currentValue: "350000",
        assetClass: "Stocks",
        sector: "Technology",
        targetWeight: "15",
        notes: "",
      },
    ];

    await snapshotStore.seedBaselineSnapshotsIfEmpty("client_test", {
      techExposure: 27.4,
      healthScore: 72,
      drawdown: 9.3,
      cashWeight: 14.2,
      forceDemo: true,
    });

    const insights = await insightEngine.evaluateClientInsights(mockClient);
    expect(insights.length).toBeGreaterThan(0);

    const concInsight = insights.find((i) => i.type === "CONCENTRATION_CHANGE");
    expect(concInsight).toBeDefined();
    expect(concInsight?.evidence.current).toBe(27.4);
    expect(concInsight?.evidence.previous).toBe(18.1);
    expect(concInsight?.evidence.delta).toBe(9.3);
    expect(concInsight?.evidence.confidence).toBe("HIGH");
  });

  it("generates deterministic structured explanation without inventing numbers", () => {
    const explanation = insightExplainer.explainInsight({
      id: "ins_1",
      clientId: "client_test",
      clientName: "Rahul Mehta",
      type: "CONCENTRATION_CHANGE",
      title: "Technology Exposure Increased by 9.3%",
      summary: "Tech exposure shifted from 18.1% to 27.4% over 90 days (+9.3 pts).",
      evidence: {
        current: 27.4,
        previous: 18.1,
        delta: 9.3,
        unit: "%",
        periodDays: 90,
        source: "Portfolio Ledger",
        confidence: "HIGH",
        threshold: 25.0,
      },
      severity: "HIGH",
      detectedAt: new Date().toISOString(),
    });

    expect(explanation.explanation).toContain("18.1%");
    expect(explanation.explanation).toContain("27.4%");
    expect(explanation.explanation).toContain("90 days");
    expect(explanation.whyItMatters).toBeTruthy();
    expect(explanation.advisorQuestions.length).toBeGreaterThan(0);
    expect(explanation.possibleActions.length).toBeGreaterThan(0);
  });

  it("never seeds synthetic baseline snapshots for real clients", async () => {
    // Attempt to seed without isDemo/forceDemo
    await snapshotStore.seedBaselineSnapshotsIfEmpty("real_client_123");
    const snapshots = await snapshotStore.getSnapshots("real_client_123");
    expect(snapshots.length).toBe(0);
  });

  it("deduplicates snapshots with same entity, metric and value within 1 hour", async () => {
    const now = new Date().toISOString();
    const snap1 = await snapshotStore.recordSnapshot({
      entityId: "client_dedup",
      entityType: "PORTFOLIO",
      metric: "total_aum",
      value: 5000000,
      timestamp: now,
    });

    const snap2 = await snapshotStore.recordSnapshot({
      entityId: "client_dedup",
      entityType: "PORTFOLIO",
      metric: "total_aum",
      value: 5000000,
      timestamp: now,
    });

    expect(snap1.id).toBe(snap2.id);
    const list = await snapshotStore.getSnapshots("client_dedup", "total_aum");
    expect(list.length).toBe(1);
  });

  it("returns INSUFFICIENT_HISTORY for a new client with only 1 snapshot", async () => {
    const newClient: Client = {
      id: "real_new_client",
      name: "Ananya Sharma",
      phone: "+91 98111 22233",
      email: "ananya@example.com",
      city: "Delhi",
      category: "Retail",
      priority: "Medium",
      preferredChannel: "Email",
      reminderDate: new Date().toISOString(),
      notes: "",
      riskProfile: "Moderate",
      allocation: "Stocks 50%, Bonds 50%",
      watchlist: [],
      updateHistory: [],
      portfolio: [
        {
          id: "h_new",
          ticker: "RELIANCE",
          assetName: "Reliance Industries",
          quantity: "50",
          investedValue: "140000",
          currentValue: "150000",
          assetClass: "Stocks",
          targetWeight: "10",
          notes: "",
        },
      ],
      lastContact: "",
    };

    // Record one snapshot
    await snapshotStore.recordPortfolioEventSnapshots(newClient);

    const insights = await insightEngine.evaluateClientInsights(newClient);
    expect(insights.length).toBe(1);
    expect(insights[0].type).toBe("INSUFFICIENT_HISTORY");
    expect(insights[0].evidence.confidence).toBe("INSUFFICIENT_DATA");
  });
});
