jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { buildConsolidatedTrajectory } from "../src/services/portfolioTrajectory";
import { snapshotStore } from "../src/services/clientInsights/snapshotStore";

describe("Consolidated Portfolio Trajectory (real history only)", () => {
  beforeEach(async () => {
    await snapshotStore.clear();
  });

  function realAumSnapshot(clientId: string, value: number, daysAgo: number) {
    const ts = new Date(Date.now() - daysAgo * 86400000).toISOString();
    return snapshotStore.recordSnapshot({
      entityId: clientId,
      entityType: "PORTFOLIO",
      metric: "total_aum",
      value,
      timestamp: ts,
      source: "Portfolio Valuation Event",
    });
  }

  it("returns an empty trajectory when only demo-seeded snapshots exist", async () => {
    await snapshotStore.seedBaselineSnapshotsIfEmpty("c1", { forceDemo: true });

    const result = await buildConsolidatedTrajectory(["c1"]);
    expect(result.ALL).toHaveLength(0);
    expect(result["1M"]).toHaveLength(0);
    expect(result["3M"]).toHaveLength(0);
    expect(result.YTD).toHaveLength(0);
    expect(result["1Y"]).toHaveLength(0);
  });

  it("shows no history until at least two genuine valuation points exist", async () => {
    await realAumSnapshot("c1", 1_000_000, 30);

    const result = await buildConsolidatedTrajectory(["c1"]);
    expect(result.ALL).toHaveLength(0);
  });

  it("aggregates genuine snapshots across clients and excludes demo ones", async () => {
    await snapshotStore.seedBaselineSnapshotsIfEmpty("c1", { forceDemo: true });
    // Two real valuations for c1 (40d and 10d ago)
    await realAumSnapshot("c1", 2_000_000, 40);
    await realAumSnapshot("c1", 2_100_000, 10);
    // c2 only one real valuation (matches c1's 10d point)
    await realAumSnapshot("c2", 800_000, 10);

    const result = await buildConsolidatedTrajectory(["c1", "c2"]);

    expect(result.ALL).toHaveLength(2);
    const latest = [...result.ALL].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0];
    expect(latest.value).toBe(2_900_000);

    // The 40d-ago point reflects only c1 (c2 had no point that day)
    const earliest = [...result.ALL].sort((a, b) => a.date.localeCompare(b.date))[0];
    expect(earliest.value).toBe(2_000_000);
  });
});