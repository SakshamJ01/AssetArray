import { Client } from "../types/wealth";

/**
 * Synthetic (non-user) client entities.
 *
 * A synthetic client is an in-memory aggregate construct used for cross-client
 * analytics (e.g. the unified discretionary portfolio view). It is NOT a real
 * person and must never be represented anywhere in the client roster:
 *
 *   - Clients screen
 *   - client search results
 *   - client counts / KPIs
 *   - client avatars
 *   - Client 360 workspace
 *   - client selectors / command palette
 *   - client reports
 *   - client portal
 *   - broadcast targeting
 *
 * Legitimate cross-client analytics may still consume the aggregate internally;
 * it simply may not masquerade as an actual client.
 */
export const SYNTHETIC_CLIENT_IDS: readonly string[] = ["unified-discretionary"];

export const SYNTHETIC_CLIENT_NAMES: readonly string[] = [
  "Unified Discretionary Wealth",
];

/**
 * Stable IDs of legacy test/demo client records identified by the production
 * forensic audit (docs/v4/operations/TEST_DATA_FORENSIC_AUDIT.md).
 *
 * These are timestamp-based identifiers created during early UAT and automated
 * E2E runs on 2026-05-03. They are quarantined (never silently deleted) by the
 * browser storage migration so a human can review them, and they are reported
 * by the backend dry-run cleanup script.
 */
export const LEGACY_TEST_CLIENT_IDS: readonly string[] = [
  "1777753624999", // Saksham jain
  "1777796687993", // Daksh
];

const E2E_NAME_MARKER = "E2E_TEST";

/**
 * Returns true when the entity is a synthetic aggregate, not a real client.
 *
 * Detection is by stable synthetic id (primary), the explicit `isSynthetic`
 * provenance flag, or the known synthetic display name (defense in depth).
 */
export function isSyntheticClient(client: Client | undefined | null): boolean {
  if (!client) return false;
  if (client.isSynthetic === true) return true;
  if (SYNTHETIC_CLIENT_IDS.includes(client.id)) return true;
  if (SYNTHETIC_CLIENT_NAMES.includes(client.name)) return true;
  return false;
}

/**
 * Remove every synthetic aggregate from a list, leaving only real clients.
 * Safe for undefined/null input. Does not mutate the input array.
 */
export function filterSyntheticClients(
  clients: Client[] | undefined | null
): Client[] {
  if (!Array.isArray(clients)) return [];
  return clients.filter((client) => !isSyntheticClient(client));
}

/**
 * Split a list into real clients and synthetic entities.
 * Used by the storage migration to quarantine synthetic state without
 * destroying it.
 */
export function partitionSyntheticClients(clients: Client[] | undefined | null): {
  real: Client[];
  synthetic: Client[];
} {
  if (!Array.isArray(clients)) return { real: [], synthetic: [] };
  const real: Client[] = [];
  const synthetic: Client[] = [];
  for (const client of clients) {
    if (isSyntheticClient(client)) synthetic.push(client);
    else real.push(client);
  }
  return { real, synthetic };
}

/**
 * Detect legacy automated-test client records by their stable provenance
 * markers (E2E marker in the display name or a known legacy test id).
 *
 * Display-name matching is used ONLY to classify an already-suspicious record
 * for quarantine/review — it is never used as a deletion criterion on its own.
 */
export function isLegacyTestClient(client: Client | undefined | null): boolean {
  if (!client) return false;
  if (LEGACY_TEST_CLIENT_IDS.includes(client.id)) return true;
  if (typeof client.name === "string" && client.name.includes(E2E_NAME_MARKER))
    return true;
  return false;
}
