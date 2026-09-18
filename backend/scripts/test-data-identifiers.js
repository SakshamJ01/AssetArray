/**
 * AssetArray — Known Test-Data Identifier Registry
 *
 * Single source of truth for the EXACT records identified by the production
 * forensic audit (docs/v4/operations/TEST_DATA_FORENSIC_AUDIT.md).
 *
 * Safety rules enforced by every consumer of this module:
 *   1. Deletion is ONLY ever performed against these explicit, stable
 *      identifiers — never by display name, never by wildcard, and never
 *      collection-wide.
 *   2. Every candidate is re-verified at cleanup time before deletion.
 *   3. A backup/export is always taken first.
 *
 * These are stable provenance markers (document IDs / owner hash / E2E id
 * prefix), not display names.
 */

const LEGACY_PIN_OWNER_ID = "03ac674216f3e15c761ee1a5"; // SHA-256 of legacy PIN 1234

// Stable client document ids created during UAT / automated E2E on 2026-05-03.
const LEGACY_TEST_CLIENT_IDS = [
  "1777753624999", // Saksham jain
  "1777796687993", // Daksh
];

// Automated browser-validation client ids use this stable prefix.
const E2E_CLIENT_ID_PREFIX = "client_e2e_";
const E2E_NAME_MARKER = "E2E_TEST";

// Broadcast campaigns created during the same manual UAT session.
const LEGACY_TEST_CAMPAIGN_IDS = [
  "1777796717135",
  "1777795117399",
  "1777793960723",
];

const SYNC_COLLECTION = "encrypted_sync_blobs";
const CLIENTS_COLLECTION = "clients";
const BROADCASTS_COLLECTION = "broadcast_campaigns";

/**
 * Build the exact, narrowly-scoped match queries used for IDENTIFICATION only.
 * Each query targets a specific collection and pins stable identifiers.
 */
function buildIdentificationQueries() {
  return {
    syncBlobs: {
      collection: SYNC_COLLECTION,
      filter: { ownerId: LEGACY_PIN_OWNER_ID },
      // Never report ciphertext or secrets — projection strips them.
      projection: { projection: { _id: 1, ownerId: 1, firmId: 1, updatedAt: 1, updatedBy: 1 } },
      idField: "ownerId",
      source: "Legacy dev encrypted backup (PIN 1234) — quarantined file backend/data/quarantine/sync-store.json",
    },
    legacyClients: {
      collection: CLIENTS_COLLECTION,
      filter: { id: { $in: [...LEGACY_TEST_CLIENT_IDS] } },
      projection: { projection: { _id: 1, id: 1, firmId: 1, name: 1, createdAt: 1 } },
      idField: "id",
      source: "Early UAT manual entry (2026-05-03)",
    },
    e2eClients: {
      collection: CLIENTS_COLLECTION,
      filter: { id: { $regex: `^${E2E_CLIENT_ID_PREFIX}` } },
      projection: { projection: { _id: 1, id: 1, firmId: 1, name: 1, createdAt: 1 } },
      idField: "id",
      source: "Automated Playwright browser validation (scripts/run-e2e-browser-validation.js)",
    },
    legacyCampaigns: {
      collection: BROADCASTS_COLLECTION,
      filter: { campaignId: { $in: [...LEGACY_TEST_CAMPAIGN_IDS] } },
      projection: { projection: { _id: 1, campaignId: 1, createdBy: 1, createdAt: 1, totalClients: 1 } },
      idField: "campaignId",
      source: "Early UAT broadcast campaigns (2026-05-03)",
    },
  };
}

/**
 * Broadcast campaigns whose embedded client roster references a known test
 * client id. Uses explicit ids only — never a name match.
 */
function buildCampaignClientIdQuery(foundTestClientIds) {
  const ids = [...LEGACY_TEST_CLIENT_IDS, ...foundTestClientIds];
  return {
    collection: BROADCASTS_COLLECTION,
    filter: { "clients.id": { $in: ids } },
    projection: { projection: { _id: 1, campaignId: 1, createdBy: 1, createdAt: 1, totalClients: 1 } },
    idField: "campaignId",
    source: "Campaign targeting a known test client id",
  };
}

module.exports = {
  LEGACY_PIN_OWNER_ID,
  LEGACY_TEST_CLIENT_IDS,
  E2E_CLIENT_ID_PREFIX,
  E2E_NAME_MARKER,
  LEGACY_TEST_CAMPAIGN_IDS,
  SYNC_COLLECTION,
  CLIENTS_COLLECTION,
  BROADCASTS_COLLECTION,
  buildIdentificationQueries,
  buildCampaignClientIdQuery,
};
