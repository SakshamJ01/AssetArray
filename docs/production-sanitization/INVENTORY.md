# Production Sanitization Inventory (3.3.x)

Classification key per hit — every artifact found by the demo/judge/showcase
sweep is listed below with its disposition:

| Class | Meaning |
| --- | --- |
| `REMOVE` | Shipped-product content removed (no judge scaffold in production). |
| `TEST-ONLY` | Kept strictly as automated test fixtures/verification. |
| `DEV-ONLY` | Kept in scripts/harnesses only; excluded from the shipped app bundle. |
| `KEEP` | Legitimate product feature retained (explicitly labeled; never silently auto-selected). |
| `MIGRATE` | Renamed/reshaped so the shipped surface has no demo naming; legacy name documented. |

## 1. Authentication & Sessions

| Hit | Location | Class | Status |
| --- | --- | --- | --- |
| `demo-login` route | `backend/server.js` | `REMOVE` | Route deleted; `POST /api/auth/demo-login` no longer exists. |
| Demo identity seeding | `backend/server.js` | `REMOVE` | Seed block deleted; no demo role/user created on boot. |
| `DEMO_AUTH_ENABLED` / `DEMO_USERNAME` | `backend/config/env.js`, `render.yaml`, `backend/.env.example` | `REMOVE` | Env plumbing deleted. |
| Cookie/session traces of demo session | `backend/server.js` | `REMOVE` | `SET_COOKIE` / JWT issuance for demo call path removed with the route. |
| `DemoLoginOptions` + `demoLoginAdvisor` | `src/services/secureSync.ts` | `REMOVE` | Deleted. |
| `quickDemoLogin` / `continueOffline` | `App.tsx` | `REMOVE` | Flow, buttons, and offline-bypass removed. |
| `seedDemoClients` + `resetDemoProStatus` wiring | `App.tsx`, screens | `REMOVE` | Props/imports stripped. |
| Login screen "1-Click Demo Sign In" / "Continue in Offline Mode" | `App.tsx` login UI | `REMOVE` | Screen is credentials-only: Username + Password + Sign In. |
| "DEMO WORKSPACE ACTIVE" banner | `App.tsx`/header | `REMOVE` | Marker gone; workspace has no synthetic session indicator. |
| DEMO_CLIENTS fixture + `demoData.ts` | `src/services/demoData.ts` | `REMOVE` | File deleted (was not referenced by tests). Avatar map moved to `src/services/avatars.ts`. |
| End-to-end auth tests asserting removal | `__tests__/backendAuth.test.ts` | `TEST-ONLY` | TESTS 3/4 assert `demo-login` absence in backend + bundle. |

Real auth is **untouched**: JWT access (15m) + rotating refresh (30d), per-user
PBKDF2, logout/revocation, sync ownership, login rate-limit, and admin
env-only identity all remain. See `docs/core-integrity/AUTHENTICATION.md`.

## 2. Data / Seeding

| Hit | Location | Class | Status |
| --- | --- | --- | --- |
| Activity timeline demo seed | `src/services/advisor/activityTimeline.ts` | `REMOVE` | Starts empty; `activitiesLoadedFromStorage` gate. |
| Decision journal demo seed | `src/services/advisor/decisionJournal.ts` | `REMOVE` | Starts empty; `decisionsLoadedFromStorage` gate. |
| Mock custodial account seeding | `src/services/custodian/custodianSync.ts` | `REMOVE` | Constructor seed + `seedMockAccounts()` removed; starts empty, honest "No connected custodial accounts" result. |
| `isDemo` fallback / seeding in Client 360 | `src/components/client360/Client360Workspace.tsx` | `REMOVE` | "DEMO · " label and demo hydrate block removed. |
| Honest empty state + `onAddClient` | `src/screens/ClientsScreen.tsx`, `App.tsx` | `KEEP` | "No clients yet" + Add Client; no demo roster button. |
| Snapshot baseline seeding | `src/services/clientInsights/snapshotStore.ts` | `TEST-ONLY` | `seedBaselineSnapshotsIfEmpty(isDemo)` broad-guarded to explicit `isDemo/forceDemo`; real clients emit `INSUFFICIENT_HISTORY`. Used by `clientInsightTruth.test.ts`, `clientInsights.test.ts`. |
| Demo history labels | `snapshotStore.ts` | `KEEP` | `source: "DEMO DATA · SIMULATED HISTORY"` only produced under explicit `isDemo:true` (tests). |
| `isDemoMode` market toggles | `src/services/market/marketProvider.ts` | `KEEP` | Default `false`; simulated history/sector only when explicitly requested. |

## 3. Billing

| Hit | Location | Class | Status |
| --- | --- | --- | --- |
| `DEMO_PRO_STORAGE_KEY` | `src/platform/billing/billing.web.ts`, `billing.native.ts` | `MIGRATE` | Real web entitlement persistence (web stores pro entitlement in AsyncStorage, mirroring native RC storage). Legacy name; documented, not user-facing. |
| `resetDemoProStatus` | `billing.web.ts`, `billing.native.ts`, `types.ts`, `__tests__/pal.test.ts` | `KEEP` | Functional entitlement reset; used by tests + Settings/Admin flows. |
| `revenueCat.resetDemoProStatus` re-export | `src/services/revenueCat.ts` | `REMOVE` | Dead export deleted; paywall/restore flow unchanged. |
| Settings "Subscription & Simulation Harness" | `src/screens/SettingsScreen.tsx` | `REMOVE` | Replaced with plain "Subscription" section. |
| README "Sandbox Reset" instructions | `README.md` | `REMOVE` | Replaced by "Restore Purchases". |
| REV-02 sandbox reset inventory entry | `feature-inventory.json`, `generate-feature-inventory.js` | `REMOVE` | Now "RevenueCat Restore Purchases" only. |

## 4. Scenario / Simulation (legitimate features)

| Hit | Location | Class | Status |
| --- | --- | --- | --- |
| What-If Macro Scenario Sandbox | `src/services/sandbox/…`, UI modals, backend engine | `KEEP` | Real advisor tool; entry is explicit/opt-in, output labeled SIMULATED uses `SIMULATED` status. |
| `simulationProvider.ts` | `src/services/simulation/` | `KEEP` | Feed for explicit simulation/sandbox mode only; `SIMULATED` labeling enforced by `quoteValidator`. |
| `DEFAULT_QUOTES` fallback | `src/services/marketData.ts` | `KEEP` | Offline/first-paint fallback, clearly commented as simulated; live quotes arrive over the network. |
| Sector/history simulation toggles | `marketProvider.ts` | `KEEP` | `isDemoMode=false` default; missing live data → `UNAVAILABLE` / `[]`, never silent sim. |

## 5. Offline behavior (real product capability)

| Hit | Location | Class | Status |
| --- | --- | --- | --- |
| Offline sync state `"Offline only"` / `"Sync failed (Offline)"` | `App.tsx`, `network.ts` | `KEEP` | Real network status UX; not a demo bypass. |
| Deterministic/offline rule-engine fallback | `verified-rule-engine` | `KEEP` | Free-tier AI path; zero-cost fallback is a product feature. |

## 6. Docs, matrices, QA harnesses

| Hit | Location | Class | Status |
| --- | --- | --- | --- |
| README demo sign-in / offline bullets | `README.md` | `REMOVE` | Rewritten to production auth + honest empty state. |
| AUTH-04 demo, AUTH-07 offline entries | `feature-inventory.json`, `generate-feature-inventory.js` | `REMOVE` | Deleted; regenerated (82 → 79 features). |
| CLIENT-10 demo roster entry | same | `REMOVE` | Deleted. |
| `AUTHENTICATION.md` demo/offline modes | `docs/core-integrity/AUTHENTICATION.md` | `REMOVE` | Rewritten: single REAL auth path; demo-login absence documented. |
| Historical audit docs (pre-sanitization records) | `docs/FINAL_P0_P1_CLEANUP.md`, `docs/PRODUCTION_TRUTH_FINAL.md`, `docs/full-system-verification/*`, `docs/FINAL_PRODUCTION_TRUTH_AUDIT.md`, `docs/USER_ACCEPTANCE_AUDIT.md`, `docs/qa/RESPONSIVE_INTERACTION_QA.md`, `docs/feature-integrity-matrix.md`, `docs/data-provider-matrix.md` | `KEEP` | Immutable historical records of earlier phases; note they document the pre-3.3.x demo surfaces that this pass removed. |
| Auth browser validation harness | `scripts/run-auth-browser-validation.js` | `DEV-ONLY` | Rewritten: SEC-01 asserts NO demo/offline shortcut; manual login + logout + invalid-login only. |
| E2E browser / mobile harnesses | `run-e2e-browser-validation.js`, `run-mobile-e2e-validation.js` | `DEV-ONLY` | Form-based real-credential login; requires `E2E_TEST_USERNAME`/`PASSWORD`. |
| Forensic / interaction harnesses | `run-forensic-qa.js`, `run-interaction-qa.js` | `DEV-ONLY` | Stub boundary now `POST /api/auth/login` with `qa-advisor` (not demo); geometry QA only. |

## 7. Frontend internals

| Hit | Location | Class | Status |
| --- | --- | --- | --- |
| `DEFAULT_CLIENT_AVATARS` + `getClientAvatar` | `src/services/avatars.ts` | `KEEP` | Deterministic per-client avatar fallback (initials) for real clients. |
| Hardcoded KPIs (14/18/4.2), "$2.45M", `client-1` | `src/features/advisor/AdvisorCommandCenter.tsx` | `REMOVE` | KPIs computed from real activity; AUM fallback now ₹0; sync loops over real clients. |

## Verification evidence for this pass
- `npx tsc --noEmit` clean.
- `npx jest --forceExit --maxWorkers=50%` → 47 suites / 264 tests pass (incl. new removal assertions).
- `node scripts/generate-feature-inventory.js` → 79 features, no demo-login/offline/roster-seed entries.
- `POST /api/auth/demo-login` removed from backend source; production deploy nullifies the live endpoint.
- Web bundle secret rescan + manual production smoke pending final deploy step.