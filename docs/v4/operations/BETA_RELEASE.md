# AssetArray V4.0 — Beta Release Record

**Release:** V4.0 Public Beta
**Gate Date:** September 19, 2026
**Deployed Commit:** `5439e4b85c11f432ddd6631d2d738d2ff471e37a`
**Preceded by:** `TEST_DATA_FORENSIC_AUDIT.md` → `TEST_DATA_REMEDIATION.md` → `POST_REMEDIATION_GATE.md`

---

## Release Artifacts

| Artifact | Location | Result |
| :--- | :--- | :--- |
| Frontend (web) | https://asset-array.web.app | **Deployed** (HTTP 200) |
| Backend (API) | https://assetarray.onrender.com | **Deployed** (HTTP 200, `db: connected`) |
| Production bundle | `dist/_expo/static/js/web/AppEntry-6cd351043a15a176f0076edf1cfd8778.js` | **Clean** (0 test-client strings) |

## Gate Verification Summary

| Check | Result |
| :--- | :--- |
| `npx tsc --noEmit` | **PASS** (0 errors) |
| `node --check backend/server.js` + scripts | **PASS** |
| Full Jest suite (3 consecutive runs) | **PASS** 454/454, 81/81 suites |
| Production web build | **PASS** |
| Fresh-browser production gate | **PASS** 5/5 |
| Cloud restore safety | **PASS** (legacy backup → HTTP 409) |
| Browser storage migration | **PASS** 6/6 |
| MongoDB read-only dry run | **COMPLETE** (1 test record identified, 0 deleted) |
| Production tenant data check | **PASS** (0 unexpected test clients) |

## Public Beta Scope

- Client roster, portfolios, tools, workspace, AI research, settings.
- Local-first architecture with PIN-encrypted vault and optional encrypted
  cloud backup sync (provenance-guarded).
- Multi-tenant backend with RBAC and firm-scoped data isolation.

## Release Criteria Met

1. No synthetic aggregate can appear as a client in any roster surface.
2. A brand-new public user inherits zero test client state (verified with a
   fully isolated fresh browser context).
3. Legacy pre-V4 browser state migrates forward safely; test/synthetic state is
   quarantined, never silently erased.
4. Legacy development sync backups cannot be restored on the production
   service (HTTP 409 `UNTRUSTED_BACKUP_PROVENANCE`).
5. Automated E2E no longer writes into a developer's browser profile.

**Final status: `PUBLIC BETA OPERATING`**
