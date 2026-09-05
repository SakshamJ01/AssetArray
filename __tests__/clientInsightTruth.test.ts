import {
  snapshotStore,
  insightEngine,
} from "../src/services/clientInsights";
import { Client, Goal } from "../src/types/wealth";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("Client Insight Truth & Real Historical Pipeline", () => {
  beforeEach(async () => {
    await snapshotStore.clear();
  });

  const baseClient: Client = {
    id: "truth_client_1",
    name: "Suresh Narayanan",
    phone: "+91 98450 12345",
    email: "suresh@example.com",
    city: "Hyderabad",
    category: "HNI",
    priority: "High",
    preferredChannel: "WhatsApp",
    reminderDate: new Date().toISOString(),
    notes: "",
    riskProfile: "Aggressive",
    allocation: "Stocks 70%, Cash 30%",
    watchlist: [],
    updateHistory: [],
    portfolio: [
      {
        id: "h_t1",
        ticker: "TCS",
        assetName: "Tata Consultancy Services",
        quantity: "100",
        investedValue: "320000",
        currentValue: "380000",
        assetClass: "Stocks",
        sector: "Technology",
        targetWeight: "15",
        acquisitionDate: "2023-01-10",
        notes: "",
      },
      {
        id: "h_t2",
        ticker: "LIQUID",
        assetName: "HDFC Liquid Fund",
        quantity: "1000",
        investedValue: "100000",
        currentValue: "110000",
        assetClass: "Cash",
        targetWeight: "10",
        acquisitionDate: "2023-06-15",
        notes: "",
      },
    ],
    lastContact: "",
  };

  it("never seeds synthetic numbers for real clients without explicit demo flag", async () => {
    await snapshotStore.seedBaselineSnapshotsIfEmpty("truth_client_1");
    const list = await snapshotStore.getSnapshots("truth_client_1");
    expect(list.length).toBe(0);
  });

  it("records genuine historical snapshots from real application events", async () => {
    await snapshotStore.recordPortfolioEventSnapshots(baseClient, "Statement Upload Event");

    const aumSnaps = await snapshotStore.getSnapshots("truth_client_1", "total_aum");
    expect(aumSnaps.length).toBe(1);
    expect(aumSnaps[0].value).toBe(490000); // 380k + 110k
    expect(aumSnaps[0].source).toBe("Statement Upload Event");

    const techSnaps = await snapshotStore.getSnapshots("truth_client_1", "sector_concentration_tech");
    expect(techSnaps.length).toBe(1);
    // 380,000 / 490,000 = 77.6%
    expect(techSnaps[0].value).toBe(77.6);
  });

  it("deduplicates identical snapshots recorded within a 1-hour window", async () => {
    await snapshotStore.recordPortfolioEventSnapshots(baseClient, "First Valuation Event");
    await snapshotStore.recordPortfolioEventSnapshots(baseClient, "Second Valuation Event (Same data)");

    const aumSnaps = await snapshotStore.getSnapshots("truth_client_1", "total_aum");
    // Duplicate prevented
    expect(aumSnaps.length).toBe(1);
  });

  it("returns INSUFFICIENT_HISTORY with INSUFFICIENT_DATA confidence for a client with only 1 valuation cycle", async () => {
    await snapshotStore.recordPortfolioEventSnapshots(baseClient, "Initial Valuation");

    const insights = await insightEngine.evaluateClientInsights(baseClient);
    expect(insights.length).toBe(1);
    expect(insights[0].type).toBe("INSUFFICIENT_HISTORY");
    expect(insights[0].evidence.confidence).toBe("INSUFFICIENT_DATA");
    expect(insights[0].summary).toContain("at least two valuation snapshots");
  });

  it("calculates dynamic HIGH confidence when holdings are complete, lookback coverage is solid, and snapshot is fresh", async () => {
    const now = Date.now();
    const dayMs = 86400000;

    // Record two historical points for sector concentration
    await snapshotStore.recordSnapshot({
      entityId: "truth_client_1",
      entityType: "PORTFOLIO",
      metric: "sector_concentration_tech",
      value: 15.0,
      timestamp: new Date(now - 90 * dayMs).toISOString(),
      source: "Ledger Close 90D",
    });

    await snapshotStore.recordSnapshot({
      entityId: "truth_client_1",
      entityType: "PORTFOLIO",
      metric: "sector_concentration_tech",
      value: 28.5,
      timestamp: new Date(now).toISOString(),
      source: "Live Valuation",
    });

    const insights = await insightEngine.evaluateClientInsights(baseClient);
    const conc = insights.find((i) => i.type === "CONCENTRATION_CHANGE");

    expect(conc).toBeDefined();
    expect(conc?.evidence.delta).toBe(13.5);
    expect(conc?.evidence.confidence).toBe("HIGH");
    expect(conc?.isDemo).toBe(false);
  });

  it("strictly isolates demo history with isDemo: true and DEMO DATA label", async () => {
    await snapshotStore.seedBaselineSnapshotsIfEmpty("demo_client_99", {
      techExposure: 30.0,
      isDemo: true,
    });

    const list = await snapshotStore.getSnapshots("demo_client_99");
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].isDemo).toBe(true);
    expect(list[0].source).toContain("DEMO DATA");
  });
});
