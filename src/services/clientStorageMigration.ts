import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client } from "../types/wealth";
import {
  filterSyntheticClients,
  isLegacyTestClient,
  partitionSyntheticClients,
} from "./syntheticClients";

/**
 * Versioned client-state migration for browser persistence.
 *
 * History:
 *  - v1 (legacy): a bare JSON array of clients stored under CLIENTS_KEY.
 *                 Includes pre-V4 manual UAT records and automated E2E records.
 *  - v2 (current): an envelope `{ schemaVersion, clients, migratedAt }`.
 *                 Synthetic aggregates and legacy test records are quarantined
 *                 out of the active roster on read.
 *
 * Goals:
 *  - Detect legacy / pre-V4 / test state.
 *  - Migrate legitimate records forward untouched.
 *  - Quarantine clearly identified test/synthetic state (never blind erasure).
 *  - Guarantee a brand-new public user can never inherit old test client state.
 */

export const CLIENTS_SCHEMA_VERSION = 2;

const CLIENTS_KEY = "asset_array_clients";
const CLIENTS_QUARANTINE_KEY = "asset_array_clients_quarantine";
const SCHEMA_VERSION_KEY = "asset_array_clients_schema_version";

type LegacyEnvelope = Client[];
type CurrentEnvelope = {
  schemaVersion: number;
  clients: Client[];
  migratedAt: string;
};
type StoredShape = LegacyEnvelope | CurrentEnvelope | null;

export type MigrationResult = {
  clients: Client[];
  schemaVersion: number;
  quarantined: Client[];
  didMigrate: boolean;
};

function isEnvelope(value: StoredShape): value is CurrentEnvelope {
  return (
    !!value &&
    !Array.isArray(value) &&
    typeof (value as CurrentEnvelope).schemaVersion === "number" &&
    Array.isArray((value as CurrentEnvelope).clients)
  );
}

function appendQuarantine(synthetic: Client[]): Promise<void> {
  if (synthetic.length === 0) return Promise.resolve();
  return AsyncStorage.getItem(CLIENTS_QUARANTINE_KEY).then((raw) => {
    const existing = Array.isArray(JSON.parse(raw || "[]")) ? JSON.parse(raw || "[]") : [];
    const merged = [...existing, ...synthetic];
    return AsyncStorage.setItem(CLIENTS_QUARANTINE_KEY, JSON.stringify(merged));
  }).catch(() => undefined);
}

/**
 * Pure migration core. Operates on an already-parsed payload so it is fully
 * unit-testable with no storage dependency.
 *
 * - Synthetic aggregates are always removed from the roster and quarantined.
 * - Legacy test records are quarantined only when migrating from a legacy
 *   (unversioned) store, i.e. pre-V4 state. Versioned current stores have
 *   already been cleaned, so their records are trusted as real user data.
 */
export function migrateClientPayload(
  parsed: StoredShape,
  options: { trustVersioned?: boolean } = {}
): MigrationResult {
  const trustVersioned = options.trustVersioned !== false;

  if (parsed == null) {
    return { clients: [], schemaVersion: CLIENTS_SCHEMA_VERSION, quarantined: [], didMigrate: false };
  }

  const wasVersioned = isEnvelope(parsed);
  const rawClients: Client[] = wasVersioned
    ? (parsed as CurrentEnvelope).clients
    : (parsed as LegacyEnvelope);

  const array = Array.isArray(rawClients) ? rawClients : [];

  // Synthetic aggregates can never be roster members, regardless of version.
  const { real, synthetic } = partitionSyntheticClients(array);

  let quarantined = synthetic;
  let trusted = real;

  if (!wasVersioned || !trustVersioned) {
    // Legacy unversioned store: quarantine known legacy test records too.
    const keep: Client[] = [];
    for (const client of real) {
      if (isLegacyTestClient(client)) quarantined.push(client);
      else keep.push(client);
    }
    trusted = keep;
  }

  const didMigrate =
    quarantined.length > 0 || !wasVersioned || (wasVersioned && (parsed as CurrentEnvelope).schemaVersion !== CLIENTS_SCHEMA_VERSION);

  return {
    clients: trusted,
    schemaVersion: CLIENTS_SCHEMA_VERSION,
    quarantined,
    didMigrate,
  };
}

/**
 * Read, migrate, and re-persist the client roster.
 *
 * Never throws: on unreadable/corrupt state the raw payload is preserved in the
 * quarantine key and an empty roster is returned, so a corrupt blob can never
 * block app startup and legitimate data is never silently destroyed.
 */
export async function loadAndMigrateClients(): Promise<MigrationResult> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(CLIENTS_KEY);
  } catch {
    return { clients: [], schemaVersion: CLIENTS_SCHEMA_VERSION, quarantined: [], didMigrate: false };
  }

  if (raw == null) {
    return { clients: [], schemaVersion: CLIENTS_SCHEMA_VERSION, quarantined: [], didMigrate: false };
  }

  let parsed: StoredShape;
  try {
    parsed = JSON.parse(raw) as StoredShape;
  } catch {
    // Corrupt payload: preserve it for manual review instead of erasing.
    await AsyncStorage.setItem(CLIENTS_QUARANTINE_KEY, JSON.stringify([raw])).catch(() => undefined);
    await AsyncStorage.removeItem(CLIENTS_KEY).catch(() => undefined);
    return { clients: [], schemaVersion: CLIENTS_SCHEMA_VERSION, quarantined: [], didMigrate: true };
  }

  const result = migrateClientPayload(parsed);

  if (result.didMigrate) {
    const envelope: CurrentEnvelope = {
      schemaVersion: CLIENTS_SCHEMA_VERSION,
      clients: result.clients,
      migratedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(envelope)).catch(() => undefined);
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(CLIENTS_SCHEMA_VERSION)).catch(() => undefined);
    if (result.quarantined.length > 0) {
      await appendQuarantine(result.quarantined);
    }
  }

  return result;
}

/**
 * Persist clients using the current versioned envelope. Synthetic aggregates
 * are stripped first so they can never be written into the roster store.
 */
export async function persistMigratedClients(clients: Client[]): Promise<void> {
  const clean = filterSyntheticClients(clients);
  const envelope: CurrentEnvelope = {
    schemaVersion: CLIENTS_SCHEMA_VERSION,
    clients: clean,
    migratedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(envelope));
}

/**
 * Narrowly scoped reset of the client roster store only. Used by the
 * "Forgot PIN? Reset App Lock" flow. Does NOT clear unrelated application state.
 */
export async function resetClientStorage(): Promise<void> {
  await AsyncStorage.removeItem(CLIENTS_KEY).catch(() => undefined);
  await AsyncStorage.removeItem(SCHEMA_VERSION_KEY).catch(() => undefined);
}

export { CLIENTS_KEY, CLIENTS_QUARANTINE_KEY };
