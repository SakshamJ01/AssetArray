/**
 * AssetArray — Test Data Remediation regression suite.
 *
 * Guards the invariants established by the production test-data remediation:
 *
 *   1. The synthetic aggregate never appears as a client.
 *   2. Legacy test data cannot resurrect through sync / cloud restore.
 *   3. Empty production client state yields an empty roster (no demo fallback).
 *   4. E2E browser storage is isolated from developer profiles.
 *   5. Legitimate client records survive the versioned state migration.
 */

import fs from "fs";
import path from "path";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client } from "../src/types/wealth";
import {
  filterSyntheticClients,
  isSyntheticClient,
  isLegacyTestClient,
  partitionSyntheticClients,
  SYNTHETIC_CLIENT_IDS,
} from "../src/services/syntheticClients";
import {
  CLIENTS_SCHEMA_VERSION,
  loadAndMigrateClients,
  migrateClientPayload,
  persistMigratedClients,
} from "../src/services/clientStorageMigration";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const realClient = (overrides: Partial<Client> = {}): Client => ({
  id: "cli_real_1",
  name: "Aarav Mehta",
  phone: "+919820000001",
  email: "aarav.mehta@example.com",
  category: "HNI",
  riskProfile: "Aggressive Growth",
  preferredChannel: "Email",
  watchlist: [],
  notes: "Long-standing discretionary mandate",
  city: "Mumbai",
  allocation: "Aggressive Growth",
  reminderDate: "2026-09-01T00:00:00.000Z",
  priority: "High",
  lastContact: "2026-08-20T00:00:00.000Z",
  updateHistory: [],
  portfolio: [],
  ...overrides,
});

const syntheticClient: Client = {
  ...realClient(),
  id: SYNTHETIC_CLIENT_IDS[0],
  name: "Unified Discretionary Wealth",
  isSynthetic: true,
};

const legacyTestClients: Client[] = [
  { ...realClient(), id: "1777753624999", name: "Saksham jain" },
  { ...realClient(), id: "1777796687993", name: "Daksh" },
  { ...realClient(), id: "client_e2e_001", name: "E2E_TEST Priya Sharma" },
];

describe("[1] Synthetic aggregate never appears as a client", () => {
  it("detects the synthetic aggregate by id, flag and name", () => {
    expect(isSyntheticClient(syntheticClient)).toBe(true);
    expect(isSyntheticClient({ ...realClient(), id: SYNTHETIC_CLIENT_IDS[0] })).toBe(true);
    expect(isSyntheticClient({ ...realClient(), name: "Unified Discretionary Wealth" })).toBe(true);
    expect(isSyntheticClient(realClient())).toBe(false);
    expect(isSyntheticClient(null)).toBe(false);
    expect(isSyntheticClient(undefined)).toBe(false);
  });

  it("removes the synthetic aggregate from a roster while keeping real clients", () => {
    const roster = [syntheticClient, realClient(), syntheticClient];
    const filtered = filterSyntheticClients(roster);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("cli_real_1");
    expect(filtered.map((c) => c.id)).not.toContain(SYNTHETIC_CLIENT_IDS[0]);
  });

  it("never surfaces the synthetic id in any roster-derivable surface", () => {
    // Mirrors App.tsx filteredClients / broadcastTargets derivation.
    const clients = [syntheticClient, realClient()];
    const filtered = filterSyntheticClients(clients);
    const counts = { total: filtered.length };
    const searchHits = filtered.filter((c) =>
      [c.name, c.email, c.phone, c.city, c.riskProfile]
        .join(" ")
        .toLowerCase()
        .includes("discretionary")
    );
    const broadcastTargets = filtered.filter((c) => c.preferredChannel === "Email");

    expect(counts.total).toBe(1);
    expect(searchHits).toHaveLength(0);
    expect(broadcastTargets.map((c) => c.id)).not.toContain(SYNTHETIC_CLIENT_IDS[0]);
  });

  it("partitions rosters into real and synthetic buckets without data loss", () => {
    const { real, synthetic } = partitionSyntheticClients([
      syntheticClient,
      realClient(),
    ]);
    expect(real.map((c) => c.id)).toEqual(["cli_real_1"]);
    expect(synthetic.map((c) => c.id)).toEqual([SYNTHETIC_CLIENT_IDS[0]]);
  });

  it("is resilient to malformed input", () => {
    expect(filterSyntheticClients(null)).toEqual([]);
    expect(filterSyntheticClients(undefined)).toEqual([]);
    expect(filterSyntheticClients([])).toEqual([]);
  });
});

describe("[2] Legacy test data cannot resurrect through sync", () => {
  it("classifies known legacy test records by stable provenance markers", () => {
    expect(isLegacyTestClient(legacyTestClients[0])).toBe(true); // Saksham jain
    expect(isLegacyTestClient(legacyTestClients[1])).toBe(true); // Daksh
    expect(isLegacyTestClient(legacyTestClients[2])).toBe(true); // E2E_TEST Priya Sharma
    expect(isLegacyTestClient(realClient())).toBe(false);
  });

  it("strips synthetic aggregates from a cloud-restore payload", () => {
    // Mirrors the App.tsx restoreFromCloud path.
    const restored = filterSyntheticClients([
      syntheticClient,
      realClient({ id: "cli_real_2" }),
    ]);
    expect(restored.map((c) => c.id)).toEqual(["cli_real_2"]);
  });

  it("quarantines legacy test records out of a legacy (unversioned) store", () => {
    const legacyStore: Client[] = [
      ...legacyTestClients,
      realClient({ id: "cli_real_keep" }),
    ];
    const result = migrateClientPayload(legacyStore);
    expect(result.clients.map((c) => c.id)).toEqual(["cli_real_keep"]);
    expect(result.quarantined.map((c) => c.id).sort()).toEqual(
      ["1777753624999", "1777796687993", "client_e2e_001"].sort()
    );
    // Quarantined, never erased: every original record is accounted for.
    expect(result.clients.length + result.quarantined.length).toBe(legacyStore.length);
  });

  it("never deletes legitimate records when quarantining test state", () => {
    const many = [
      realClient({ id: "cli_a" }),
      realClient({ id: "cli_b" }),
      realClient({ id: "cli_c" }),
      ...legacyTestClients,
    ];
    const result = migrateClientPayload(many);
    expect(result.clients.map((c) => c.id).sort()).toEqual(["cli_a", "cli_b", "cli_c"]);
  });
});

describe("[3] Empty production client state renders an empty roster", () => {
  it("treats absent storage as an empty roster with no demo fallback", () => {
    const result = migrateClientPayload(null);
    expect(result.clients).toEqual([]);
    expect(result.didMigrate).toBe(false);
  });

  it("produces an empty roster when only synthetic/test state exists", () => {
    const result = migrateClientPayload([syntheticClient, ...legacyTestClients]);
    expect(result.clients).toEqual([]);
    expect(result.quarantined.length).toBe(4);
  });

  it("never substitutes fixture/demo clients for a real empty roster", () => {
    const clients = filterSyntheticClients([]);
    // The genuine empty state must reach the UI — no demo arrays are injected.
    expect(clients).toEqual([]);
    expect(clients.length).toBe(0);
  });
});

describe("[4] E2E browser storage is isolated", () => {
  const scriptPath = path.join(
    __dirname,
    "..",
    "scripts",
    "run-e2e-browser-validation.js"
  );
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(scriptPath, "utf8");
  });

  it("uses a fresh ephemeral context, never a persistent browser profile", () => {
    expect(source).toContain("browser.newContext(");
    // launchPersistentContext would reuse a real user profile — forbidden.
    expect(source).not.toContain("launchPersistentContext");
    expect(source).toContain("storageState: undefined");
  });

  it("clears cookies and local test storage on teardown", () => {
    expect(source).toContain("clearCookies()");
    expect(source).toContain("localStorage.clear()");
    expect(source).toContain("sessionStorage.clear()");
  });

  it("guarantees teardown on both success and failure paths", () => {
    expect(source).toMatch(/async function teardownIsolatedContext/);
    // Success path (end of validation) and failure path (.catch) both call it.
    const successCalls = (source.match(/await teardownIsolatedContext\(\)/g) || []).length;
    const failureCalls = (source.match(/teardownIsolatedContext\(\)\.finally/g) || []).length;
    expect(successCalls).toBeGreaterThanOrEqual(1);
    expect(failureCalls).toBe(1);
  });

  it("clears the client roster storage key used by the app", () => {
    expect(source).toContain("asset_array_clients");
  });
});

describe("[5] Legitimate client records survive the state migration", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("migrates a legacy array into the current versioned envelope", () => {
    const legacy: Client[] = [realClient({ id: "cli_legacy_keep" }), ...legacyTestClients];
    const result = migrateClientPayload(legacy);
    expect(result.schemaVersion).toBe(CLIENTS_SCHEMA_VERSION);
    expect(result.clients.map((c) => c.id)).toEqual(["cli_legacy_keep"]);
    expect(result.didMigrate).toBe(true);
  });

  it("is idempotent: re-migrating a current store keeps every real client", () => {
    const first = migrateClientPayload([
      realClient({ id: "cli_keep" }),
      ...legacyTestClients,
    ]);
    // Second pass over the already-clean versioned store trusts its records.
    const second = migrateClientPayload({
      schemaVersion: CLIENTS_SCHEMA_VERSION,
      clients: first.clients,
      migratedAt: new Date().toISOString(),
    });
    expect(second.clients.map((c) => c.id)).toEqual(["cli_keep"]);
    expect(second.quarantined).toEqual([]);
    expect(second.didMigrate).toBe(false);
  });

  it("round-trips real clients through persistence without loss", async () => {
    const clients = [realClient({ id: "cli_roundtrip" }), syntheticClient];
    await persistMigratedClients(clients);
    const result = await loadAndMigrateClients();
    expect(result.clients.map((c) => c.id)).toEqual(["cli_roundtrip"]);
    expect(result.schemaVersion).toBe(CLIENTS_SCHEMA_VERSION);
  });

  it("persists the migrated envelope and quarantines synthetic state", async () => {
    await AsyncStorage.setItem(
      "asset_array_clients",
      JSON.stringify([realClient({ id: "cli_persist_real" }), syntheticClient])
    );
    const result = await loadAndMigrateClients();
    expect(result.clients.map((c) => c.id)).toEqual(["cli_persist_real"]);

    const stored = JSON.parse(
      (await AsyncStorage.getItem("asset_array_clients")) as string
    );
    expect(stored.schemaVersion).toBe(CLIENTS_SCHEMA_VERSION);
    expect(stored.clients.map((c: Client) => c.id)).toEqual(["cli_persist_real"]);

    const quarantined = JSON.parse(
      (await AsyncStorage.getItem("asset_array_clients_quarantine")) as string
    );
    expect(quarantined.map((c: Client) => c.id)).toEqual([SYNTHETIC_CLIENT_IDS[0]]);
  });

  it("preserves a corrupt payload for review instead of erasing it", async () => {
    await AsyncStorage.setItem("asset_array_clients", "not-valid-json{{{");
    const result = await loadAndMigrateClients();
    expect(result.clients).toEqual([]);
    const quarantined = await AsyncStorage.getItem("asset_array_clients_quarantine");
    expect(quarantined).toContain("not-valid-json{{{");
  });
});
