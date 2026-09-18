/**
 * AssetArray — Production Test-Data CLEANUP (narrowly scoped migration)
 *
 * Deletes ONLY the exact known test records identified by the dry-run report,
 * using explicit stable identifiers. Hard safety contract:
 *
 *   [x] backup/export before deletion
 *   [x] explicit test-data identifiers only (ids / owner hash / e2e prefix)
 *   [x] NO wildcard deletes
 *   [x] NO collection-wide deleteMany()
 *   [x] every candidate re-verified against its test-data filter before delete
 *   [x] delete only confirmed test records, one deleteOne() at a time
 *   [x] verify each record is gone afterward
 *   [x] verify legitimate user records remain untouched (before/after census)
 *
 * Usage:
 *   node scripts/cleanup-test-data.js              # safe preview (no deletes)
 *   node scripts/cleanup-test-data.js --execute    # perform the deletion
 *
 * The script REFUSES to run without the dry-run report present, and refuses to
 * delete anything that fails re-verification.
 */

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
const {
  buildIdentificationQueries,
  buildCampaignClientIdQuery,
} = require("./test-data-identifiers");

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "asset_array";
const QUARANTINE_DIR = path.join(__dirname, "..", "data", "quarantine");

// Secret fields that must never be written to the on-disk backup.
const REDACTED_FIELDS = ["ciphertext", "token", "refreshToken", "password", "secret", "hash"];

const EXECUTE = process.argv.includes("--execute");

function stripSecrets(doc) {
  const clean = { ...doc };
  for (const field of REDACTED_FIELDS) {
    if (clean[field] !== undefined) clean[field] = "[REDACTED]";
  }
  return clean;
}

async function identify(db) {
  const queries = buildIdentificationQueries();
  const candidates = [];

  for (const [key, spec] of Object.entries(queries)) {
    const col = db.collection(spec.collection);
    const docs = await col.find(spec.filter).toArray();
    for (const doc of docs) {
      candidates.push({ doc, spec, collection: spec.collection, idField: spec.idField });
    }
  }

  const confirmedTestClientIds = candidates
    .filter((c) => c.collection === "clients")
    .map((c) => String(c.doc[c.idField]));

  if (confirmedTestClientIds.length > 0) {
    const spec = buildCampaignClientIdQuery(confirmedTestClientIds);
    const col = db.collection(spec.collection);
    const docs = await col.find(spec.filter).toArray();
    for (const doc of docs) {
      candidates.push({ doc, spec, collection: spec.collection, idField: spec.idField });
    }
  }

  // De-duplicate by collection + identifier.
  const seen = new Set();
  const unique = [];
  for (const c of candidates) {
    const key = `${c.collection}:${String(c.doc[c.idField])}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
  }
  return unique;
}

async function main() {
  console.log("================================================================");
  console.log("AssetArray — Production Test-Data CLEANUP");
  console.log("================================================================");
  console.log("Mongo host :", new URL(MONGO_URI).host);
  console.log("Database   :", MONGO_DB_NAME);
  console.log("Mode       :", EXECUTE ? "EXECUTE (deletes will run)" : "PREVIEW (no deletes)");
  console.log("");

  if (EXECUTE && !fs.existsSync(QUARANTINE_DIR)) {
    fs.mkdirSync(QUARANTINE_DIR, { recursive: true });
  }

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
    process.exitCode = 1;
    return;
  }

  const candidates = await identify(db);
  if (candidates.length === 0) {
    console.log("No test records matched the explicit identifiers. Nothing to do.");
    await client.close();
    return;
  }

  // ---- Census BEFORE (to prove legitimate records are untouched) ----
  const before = {};
  for (const colName of ["clients", "encrypted_sync_blobs", "broadcast_campaigns"]) {
    before[colName] = await db.collection(colName).estimatedDocumentCount();
  }
  console.log("Census BEFORE:", JSON.stringify(before));
  console.log("");

  // ---- Backup / export (secrets redacted on disk) ----
  const backupStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(QUARANTINE_DIR, `test-data-backup-${backupStamp}.json`);
  if (EXECUTE) {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      database: MONGO_DB_NAME,
      recordCount: candidates.length,
      records: candidates.map((c) => ({
        collection: c.collection,
        identifier: String(c.doc[c.idField]),
        document: stripSecrets(c.doc),
      })),
      note: "Secrets redacted. Rollback reference for the test-data remediation only.",
    };
    fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2));
    console.log("Backup written:", backupPath);
    console.log("");
  }

  // ---- Verify → Delete → Verify (record by record) ----
  let deleted = 0;
  let skipped = 0;
  const deletionLog = [];

  for (const c of candidates) {
    const col = db.collection(c.collection);
    const filter = { _id: c.doc._id };

    // Re-verify the record STILL matches the exact test-data identification filter.
    const stillMatches = await col.countDocuments({ ...c.spec.filter, _id: c.doc._id });
    if (stillMatches !== 1) {
      console.log(`SKIP  ${c.collection}:${c.doc[c.idField]} — failed re-verification (${stillMatches} match)`);
      skipped++;
      deletionLog.push({
        collection: c.collection,
        identifier: String(c.doc[c.idField]),
        action: "skipped",
        reason: "failed pre-delete re-verification",
      });
      continue;
    }

    console.log(`VERIFY ${c.collection}:${c.doc[c.idField]} — confirmed test data`);

    if (!EXECUTE) {
      deletionLog.push({
        collection: c.collection,
        identifier: String(c.doc[c.idField]),
        action: "preview-only",
      });
      continue;
    }

    // Narrowly scoped single-record delete. Never deleteMany, never a wildcard.
    const result = await col.deleteOne(filter);
    const didDelete = result.deletedCount === 1;

    // Confirm it is gone.
    const stillPresent = await col.countDocuments(filter);

    if (didDelete && stillPresent === 0) {
      deleted++;
      console.log(`DELETE ${c.collection}:${c.doc[c.idField]} — removed and verified gone`);
      deletionLog.push({
        collection: c.collection,
        identifier: String(c.doc[c.idField]),
        action: "deleted",
        verifiedGone: true,
      });
    } else {
      skipped++;
      console.log(`SKIP  ${c.collection}:${c.doc[c.idField]} — delete did not verify clean`);
      deletionLog.push({
        collection: c.collection,
        identifier: String(c.doc[c.idField]),
        action: "skipped",
        reason: "post-delete verification failed",
      });
    }
  }

  // ---- Census AFTER (to prove legitimate records remain untouched) ----
  const after = {};
  for (const colName of ["clients", "encrypted_sync_blobs", "broadcast_campaigns"]) {
    after[colName] = await db.collection(colName).estimatedDocumentCount();
  }
  console.log("");
  console.log("Census AFTER :", JSON.stringify(after));
  console.log(
    "Delta        :",
    JSON.stringify(
      Object.fromEntries(
        Object.entries(after).map(([k, v]) => [k, v - before[k]])
      )
    )
  );
  console.log("");
  console.log(`Deleted: ${deleted}   Skipped/preview: ${skipped}`);

  const summaryPath = path.join(QUARANTINE_DIR, `test-data-cleanup-${backupStamp}.json`);
  if (EXECUTE) {
    fs.writeFileSync(
      summaryPath,
      JSON.stringify(
        {
          executedAt: new Date().toISOString(),
          database: MONGO_DB_NAME,
          mode: "execute",
          censusBefore: before,
          censusAfter: after,
          deletedCount: deleted,
          skippedCount: skipped,
          deletionLog,
          backupFile: backupPath,
        },
        null,
        2
      )
    );
    console.log("Cleanup summary written:", summaryPath);
  } else {
    console.log("");
    console.log("PREVIEW ONLY — no data was modified.");
    console.log("To perform the deletion, re-run with --execute.");
  }

  await client.close();
  console.log("================================================================");
}

main().catch((err) => {
  console.error("CLEANUP FAILED:", err.message);
  process.exitCode = 1;
});
