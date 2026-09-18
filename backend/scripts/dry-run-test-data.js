/**
 * AssetArray — Production Test-Data DRY-RUN Cleanup Report
 *
 * READ-ONLY. Performs ZERO write or delete operations.
 *
 * Identifies ONLY the exact known test records (by stable identifiers from
 * backend/scripts/test-data-identifiers.js) and reports:
 *   - record id
 *   - tenant / owner id
 *   - source
 *   - classification = "TEST DATA"
 *
 * It deliberately NEVER reports passwords, tokens, refresh tokens, ciphertext,
 * or any encrypted secret contents (projections strip them at the driver).
 *
 * Usage:
 *   node scripts/dry-run-test-data.js                    # read-only report
 *   MONGO_URI=... MONGO_DB_NAME=asset_array node scripts/dry-run-test-data.js
 *
 * Exit codes: 0 = report generated, 1 = could not connect / misconfigured.
 */

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
const {
  buildIdentificationQueries,
  buildCampaignClientIdQuery,
  E2E_NAME_MARKER,
} = require("./test-data-identifiers");

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "asset_array";
const REPORT_DIR = path.join(__dirname, "..", "data", "quarantine");

function redactName(name) {
  // Names are only surfaced to classify a record as test data; the E2E marker
  // is preserved because it is the provenance signal, everything else is masked.
  if (typeof name !== "string") return null;
  if (name.includes(E2E_NAME_MARKER)) return name;
  return name.replace(/[A-Za-z]/g, "•");
}

async function main() {
  console.log("================================================================");
  console.log("AssetArray — Production Test-Data DRY-RUN (READ-ONLY)");
  console.log("================================================================");
  console.log("Mongo host :", new URL(MONGO_URI).host);
  console.log("Database   :", MONGO_DB_NAME);
  console.log("Mode       : DRY-RUN (no writes, no deletes)");
  console.log("");

  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  let db;
  try {
    await client.connect();
    db = client.db(MONGO_DB_NAME);
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    console.error("Set MONGO_URI / MONGO_DB_NAME to the production cluster.");
    process.exitCode = 1;
    return;
  }

  const queries = buildIdentificationQueries();
  const findings = [];
  const collectionTotals = {};

  for (const [key, spec] of Object.entries(queries)) {
    const col = db.collection(spec.collection);
    collectionTotals[spec.collection] = await col.estimatedDocumentCount();
    const docs = await col.find(spec.filter, spec.projection).toArray();
    for (const doc of docs) {
      findings.push({
        recordId: String(doc._id),
        identifier: doc[spec.idField],
        collection: spec.collection,
        tenantOrOwnerId: doc.firmId || doc.ownerId || doc.createdBy || "unattributed",
        source: spec.source,
        classification: "TEST DATA",
        displayNameMarker: redactName(doc.name) || null,
        observedAt: new Date().toISOString(),
      });
    }
  }

  // Second pass: any broadcast campaign whose embedded client roster references
  // a confirmed test client id (explicit ids only).
  const confirmedTestClientIds = findings
    .filter((f) => f.collection === "clients")
    .map((f) => f.identifier);
  if (confirmedTestClientIds.length > 0) {
    const spec = buildCampaignClientIdQuery(confirmedTestClientIds);
    const col = db.collection(spec.collection);
    const docs = await col.find(spec.filter, spec.projection).toArray();
    for (const doc of docs) {
      if (findings.some((f) => f.identifier === doc[spec.idField] && f.collection === spec.collection)) {
        continue;
      }
      findings.push({
        recordId: String(doc._id),
        identifier: doc[spec.idField],
        collection: spec.collection,
        tenantOrOwnerId: doc.firmId || doc.createdBy || "unattributed",
        source: spec.source,
        classification: "TEST DATA",
        displayNameMarker: redactName(doc.name) || null,
        observedAt: new Date().toISOString(),
      });
    }
  }

  await client.close();

  console.log("Collection census (all documents, legitimate + test):");
  for (const [col, total] of Object.entries(collectionTotals)) {
    console.log(`  ${col.padEnd(24)} ${total}`);
  }
  console.log("");

  if (findings.length === 0) {
    console.log("RESULT: No known test records matched the explicit identifiers.");
    console.log("Production data is clean. No cleanup required.");
    console.log("================================================================");
    return;
  }

  console.log(`IDENTIFIED ${findings.length} test record(s):`);
  console.log("");
  console.log(
    "identifier".padEnd(24) +
      "collection".padEnd(24) +
      "tenant/owner".padEnd(28) +
      "classification"
  );
  console.log("-".repeat(102));
  for (const f of findings) {
    console.log(
      String(f.identifier).padEnd(24) +
        f.collection.padEnd(24) +
        String(f.tenantOrOwnerId).padEnd(28) +
        f.classification
    );
    console.log("    source:", f.source);
  }
  console.log("");

  // Persist the report for the remediation record (contains no secrets).
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "dry-run",
    database: MONGO_DB_NAME,
    collectionTotals,
    findingCount: findings.length,
    findings,
    note:
      "Read-only identification report. No passwords, tokens, ciphertext or secret contents are included.",
  };
  const reportPath = path.join(
    REPORT_DIR,
    `test-data-dry-run-${Date.now()}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log("Report written:", reportPath);
  console.log("");
  console.log("NEXT STEP: review the report, then run cleanup-test-data.js --execute");
  console.log("================================================================");
}

main().catch((err) => {
  console.error("DRY-RUN FAILED:", err.message);
  process.exitCode = 1;
});
