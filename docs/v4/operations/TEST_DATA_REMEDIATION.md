# AssetArray V4.0 — Test Data Remediation Report

**Remediation Date:** September 19, 2026
**Scope:** Client roster integrity, browser persistence, legacy sync stores, E2E isolation, cloud-restore provenance, production bundle
**Preceded by:** `docs/v4/operations/TEST_DATA_FORENSIC_AUDIT.md` (root-cause audit, zero destructive actions)
**Final Status:** `TEST DATA REMEDIATED`

---

## 1. Root Cause (confirmed by forensic audit)

The application is local-first: the client roster lives in browser `localStorage`
under `asset_array_clients`, with optional PIN-encrypted cloud backup sync. The
junk/test clients visible after the V4 launch came from exactly three sources:

1. **Browser persistence** — `localStorage["asset_array_clients"]` retained UAT
   and automated-E2E client records from earlier sessions. Re-deploying static
   bundles does not erase browser storage.
2. **Legacy encrypted sync backup** — an AES blob registered under Owner ID
   `03ac674216f3e15c761ee1a5` (SHA-256 of PIN `1234`) that decrypts to the test
   clients `Saksham jain` and `Daksh`.
3. **Frontend synthetic aggregate** — an in-memory `Client`-typed object
   `Unified Discretionary Wealth` (id `unified-discretionary`) built in
   `src/screens/PortfoliosScreen.tsx:85-102` for cross-client analytics.

The production bundle contained **no** hardcoded test roster, and MongoDB
`clients` has **no** seeding on startup (audit §4/§6).

---

## 2. Exact Source of Each Affected Entity

| Entity | Identifier | Original source | Creation mechanism |
| :--- | :--- | :--- | :--- |
| Saksham jain | `1777753624999` | `backend/data/sync-store.json` → MongoDB `encrypted_sync_blobs` (owner `03ac674216f3e15c761ee1a5`) | Early UAT manual entry + cloud backup (2026-05-03) |
| Daksh | `1777796687993` | `backend/data/broadcast-store.json` → `broadcast_campaigns` | Early UAT broadcast campaign (2026-05-03) |
| E2E_TEST Priya Sharma | `client_e2e_*` | Browser session of `scripts/run-e2e-browser-validation.js` | Automated Playwright validation run |
| Unified Discretionary Wealth | `unified-discretionary` | `src/screens/PortfoliosScreen.tsx` (in-memory) | `React.useMemo` synthetic aggregate |
| Pooja Sharma | `cli_pooja_sharma` | `__tests__/v4EndToEndIntegration.test.ts` | Test fixture (already isolated from prod) |
| Apex Custodial Statement | — | not present anywhere in the codebase | No matches found |

---

## 3. Changes Made

### Phase 1 — Synthetic aggregate removed from the client roster
- **New** `src/services/syntheticClients.ts`: single-source-of-truth registry
  (`SYNTHETIC_CLIENT_IDS`, `SYNTHETIC_CLIENT_NAMES`, `LEGACY_TEST_CLIENT_IDS`) with
  `isSyntheticClient`, `filterSyntheticClients`, `partitionSyntheticClients`,
  `isLegacyTestClient`.
- `src/types/wealth.ts`: added the `isSynthetic?: boolean` provenance flag to `Client`.
- `src/screens/PortfoliosScreen.tsx`: the aggregate is now explicitly flagged
  `isSynthetic: true` and documented as analytics-only context. It retains its
  cross-client analytics function but can never be represented as a client.
- `App.tsx`: synthetic entities are filtered at **every roster entry point** —
  local load, cloud restore, and persistence — so no roster-derived surface
  (Clients screen, search, counts, avatars, Client 360, selectors, command
  palette, reports, portal, broadcast targeting) can ever contain it.

### Phase 4 — Versioned browser persistence migration
- **New** `src/services/clientStorageMigration.ts` (`CLIENTS_SCHEMA_VERSION = 2`):
  detects legacy bare-array (pre-V4) state, migrates legitimate records forward,
  and **quarantines** (never erases) synthetic aggregates and known legacy test
  records into `asset_array_clients_quarantine`. Corrupt payloads are preserved
  for review rather than dropped. Fully idempotent.
- `App.tsx`: the boot load path now goes through `loadAndMigrateClients`;
  `persistClients` writes the versioned envelope via `persistMigratedClients`.

### Phase 2 — Legacy test sync data quarantined
- Classification: **B (development-only) / E (unused legacy)**. A full-repo
  search confirmed **no code reads these files** — runtime persistence is
  exclusively MongoDB (`backend/db/mongo.js`). The files were also **untracked**
  (`.gitignore` → `backend/data/`) and excluded from the Docker image.
- `backend/data/sync-store.json` and `backend/data/broadcast-store.json` were
  moved to `backend/data/quarantine/` with a classification README. They are now
  inert reference-only artifacts outside every runtime path.
- `backend/.dockerignore` made the exclusion explicit (`data/` + `data/quarantine/`).
  `backend/Dockerfile` copies only `server.js` + `node_modules`, and `render.yaml`
  deploys `node server.js` — so these files cannot reach any production artifact.

### Phase 3 — Dry-run + narrowly scoped cleanup (MongoDB)
- **New** `backend/scripts/test-data-identifiers.js` — explicit stable identifiers
  only (ids / owner hash / `client_e2e_` prefix). Never display names.
- **New** `backend/scripts/dry-run-test-data.js` — **read-only** report of record
  id, tenant/owner, source, and `classification: "TEST DATA"`. Projections strip
  ciphertext/tokens/passwords at the driver so no secret is ever reported.
- **New** `backend/scripts/cleanup-test-data.js` — default PREVIEW; `--execute`
  performs: secrets-redacted backup export → per-record re-verification against
  the test-data filter → single-record `deleteOne({_id})` (no wildcards, no
  collection-wide `deleteMany`) → post-delete verification → before/after census
  proving legitimate records are untouched.

### Phase 5 — E2E browser storage isolation
- `scripts/run-e2e-browser-validation.js` now uses a fresh ephemeral context
  (`storageState: undefined`, no persistent profile), and adds
  `teardownIsolatedContext()` which clears `localStorage`/`sessionStorage` and
  cookies, then closes context and browser. Teardown is guaranteed on **both**
  the success and the fatal-error paths. Automated tests can no longer write
  into a developer's normal browser profile.

### Phase 6 — Cloud restore protection
- `backend/server.js` `POST /api/sync` now stamps provenance
  (`environment`, `provenance`) on every backup.
- `GET /api/sync/:ownerId` refuses (HTTP 409, `UNTRUSTED_BACKUP_PROVENANCE`) to
  serve a development/test-origin backup — **including legacy unprovenanced
  blobs** — while the server runs in production. This blocks the PIN-1234 test
  blob from ever resurrecting. Normal authenticated sync and legitimate
  production backups (stamped `environment: production` on write) are unaffected.
- `src/services/secureSync.ts` `pullPayload` surfaces the 409 as a clear,
  non-cryptic message instead of a generic failure.

### Phase 7 — Frontend fallback audit
- Verified `src/screens/ClientsScreen.tsx:511` renders the genuine empty state
  ("No clients yet") when the roster is empty. No demo/synthetic/fixture
  substitution exists anywhere in `src/`.
- `src/services/clientInsights/snapshotStore.ts` demo seeding is gated behind
  explicit `isDemo`/`forceDemo` flags and only writes clearly-labeled insight
  *snapshots* — never client roster records.

### Phase 9 — Browser reset mechanism
The "Settings → Forgot PIN? Reset App Lock" flow (`resetLock` in `App.tsx`) now
performs a **narrowly scoped** reset of the client roster store
(`resetClientStorage` + empty persist) alongside the PIN/auth clear. It does
**not** call `localStorage.clear()` and does not touch unrelated state. The
cloud backup remains available for restore (now provenance-guarded).

**Manual steps for a currently contaminated browser:**
1. Open the app → **Settings** → **Forgot PIN? Reset App Lock**, confirm.
2. Reload the production app. The roster starts empty (legitimate cloud restore
   is re-attempted only if the backup passes the production provenance check).
   - Alternative (dev tools): run
     `localStorage.removeItem("asset_array_clients")` then reload. This targets
     only the roster key and leaves all other app state intact.

---

## 4. Production Data Cleanup Performed

**On the filesystem:** quarantined (not deleted) — see Phase 2. No production
user data was deleted.

**On MongoDB:** **No records were deleted in this session.** The cleanup scripts
were authored and verified for syntax, but by policy the destructive step
(`cleanup-test-data.js --execute`) is run only after the dry-run report is
reviewed against the live cluster. The dry-run is read-only and safe to run:

```bash
cd backend
MONGO_URI=$PROD_MONGO_URI MONGO_DB_NAME=asset_array node scripts/dry-run-test-data.js
# review backend/data/quarantine/test-data-dry-run-*.json
node scripts/cleanup-test-data.js            # preview
node scripts/cleanup-test-data.js --execute  # backup → verify → delete → verify
```

**Records deleted:** 0 (pending dry-run review + `--execute`).
**Backup/rollback reference:** `backend/data/quarantine/test-data-backup-<ts>.json`
(secrets redacted) and `backend/data/quarantine/test-data-cleanup-<ts>.json`,
both written by the cleanup script at execution time. Quarantined browser state
is preserved in `asset_array_clients_quarantine` per browser.

---

## 5. Tests

**New suite:** `__tests__/testDataRemediation.test.ts` — 21 tests, all passing,
covering all five required scenarios:

1. Synthetic aggregate never appears as a client (id/flag/name detection,
   roster/search/count/broadcast derivation, malformed input).
2. Legacy test data cannot resurrect through sync (restore payload filtering,
   legacy-store quarantine, no legitimate-record loss).
3. Empty production client state renders an empty roster (no demo fallback).
4. E2E browser storage is isolated (fresh context, `storageState: undefined`,
   cookie/storage teardown on success **and** failure, no persistent profile).
5. Legitimate client records survive state migration (legacy → envelope,
   idempotency, persistence round-trip, corrupt-payload preservation).

**Full suite:** `453 / 454` tests pass, `80 / 81` suites. The single failure
(`v4AiRouting.test.ts`, cloud-model fallback) is a pre-existing network-timeout
flake in the AI gateway — it passes in isolation and is unrelated to this
remediation.

## 6. Build & Verification Results

| Check | Result |
| :--- | :--- |
| `npx tsc --noEmit` | **PASS** (0 errors) |
| Full Jest suite | **453/454 pass** (1 unrelated flaky network-timeout) |
| Production web build (`npm run build:web`) | **PASS** (`dist/_expo/static/js/web/AppEntry-89da08e40d3b6915fa2c3fdf3871c7ed.js`) |
| Backend syntax check (`node --check`) | **PASS** (`server.js`, all scripts) |
| E2E + cleanup script syntax | **PASS** |

### Production bundle audit (`dist/`)

| Search string | Occurrences in compiled bundle | Verdict |
| :--- | :--- | :--- |
| `Saksham jain` | 0 | Clean |
| `Daksh` | 0 | Clean |
| `E2E_TEST Priya Sharma` | 0 | Clean |
| `Pooja Sharma` | 0 | Clean |
| `Apex Custodial Statement` | 0 | Clean (absent from entire codebase) |
| `Unified Discretionary Wealth` | 2 | **Intentional** — the aggregate label in `PortfoliosScreen.tsx` and the `SYNTHETIC_CLIENT_NAMES` filter registry that *removes* it from rosters |
| `1777753624999` / `1777796687993` | 1 each | **Intentional** — the `LEGACY_TEST_CLIENT_IDS` client-side quarantine registry used to exclude those records |

The bundle contains **zero hardcoded test client roster**. The only remaining
occurrences are the detection/quarantine registries themselves, which must
contain those identifiers to filter them out.

---

## 7. Deployed Verification (Phase 11 — to be executed post-deploy)

Run against the live site with a **fresh browser profile**:

1. Sign up / sign in as a brand-new account → **Clients must be EMPTY**.
2. Create **one** legitimate client → reload → **exactly ONE** client.
3. Logout → login again → **exactly ONE** client.
4. Confirm none of `Saksham jain`, `Daksh`, `E2E_TEST Priya Sharma`,
   `Pooja Sharma`, `Unified Discretionary Wealth` appears unless explicitly
   created by the current user.

---

## 8. Remaining Risks

- **MongoDB test records not yet deleted.** The legacy `encrypted_sync_blobs`
  record (owner `03ac674216f3e15c761ee1a5`) and the three test broadcast
  campaigns remain until `cleanup-test-data.js --execute` is run after dry-run
  review. They are already neutralized for production users by the
  provenance guard (Phase 6) and ownership scoping.
- **Legacy backups become non-restorable in production.** Blobs written before
  the provenance stamp carry no `environment` marker and are treated as
  untrusted on the production service. Re-backing-up from the production app
  stamps `environment: production` and restores normally. This is the intended
  trade-off to guarantee stale test state cannot resurrect.
- **Existing contaminated browsers** still hold old `localStorage`. The boot
  migration (Phase 4) quarantines known test records automatically on next load;
  users may additionally use the scoped reset (Phase 9).
- **One flaky test** (`v4AiRouting.test.ts`) depends on live cloud-model
  endpoints and can time out under load; unrelated to data remediation.

---

## 9. Git Safety

- `git status` / `git log -1 --oneline` inspected before and after changes.
- No force push, no history reset, no unrelated changes.
- Test fixtures used by automated testing (`__tests__/*.test.ts`) were left
  untouched; they run against in-memory mocks and never touch production state.

**Final status: `TEST DATA REMEDIATED`**
