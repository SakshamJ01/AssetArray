# Production Sanitization — Final Report (3.3.x)

Ship-date: 2026-09-09.

## Goal
Remove every judge/demo/showcase scaffold from the shipped product so Asset
Array behaves as a professional advisor workstation: real login, real data,
honest empty states, no seeded or fabricated content. Legitimate scenario /
simulation features stay, explicitly labeled.

## Removed (shipped surface)
- **Auth:** `/api/auth/demo-login` route + demo identity seeding + demo env
  flags (`DEMO_AUTH_ENABLED`, `DEMO_USERNAME`) from the backend; `render.yaml`
  and `.env.example` cleaned. Client `quickDemoLogin`, `continueOffline`,
  `demoLoginAdvisor`, and the "1-Click Demo Sign In" / "Continue in Offline
  Mode" UI, plus the "DEMO WORKSPACE ACTIVE" marker, are gone. Login screen is
  credentials-only.
- **Data / seeding:** `DEMO_CLIENTS` fixture + `demoData.ts` deleted;
  `seedDemoClients` removed; initial activity-timeline and decision-journal
  seeds removed (honest empty start); mock custodial accounts removed;
  Client 360 `isDemo` hydrate + "DEMO · " label removed; hardcoded
  Command Center KPIs replaced with computed values; AUM fallback is now ₹0.
- **Settings:** "Subscription & Simulation Harness" section → plain
  "Subscription".
- **Billing:** dead `revenueCat.resetDemoProStatus` re-export removed.
- **Docs/registry:** README, `AUTHENTICATION.md`, and feature inventory
  (82 → 79 features) rewritten; README "Sandbox Reset" replaced by
  "Restore Purchases".

## Kept (legitimate)
- Full production auth (JWT access/refresh, PBKDF2, logout/revocation,
  ownership, rate-limit, admin env-only identity).
- What-If Macro Scenario Sandbox engine + simulation provider (explicit,
  SIMULATED-labeled); `DEFAULT_QUOTES` offline fallback (documented);
  offline sync-state UX; deterministic rule-engine fallback.
- Billing entitlement persistence incl. legacy-named key
  `asset_array_demo_is_pro` (real storage; migration-safe).
- Test-only fixtures (`snapshotStore` iso demo seeding guards,
  `resetDemoProStatus` in tests) and `DEV-ONLY` QA harnesses
  (now credential-login based).

## Verification
| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Clean |
| `npx jest --forceExit --maxWorkers=50%` | 47 suites / 264 tests pass |
| `scripts/generate-feature-inventory.js` | 79 features, no demo entries |
| `npm run build:web` + dist secret scan | Bundle clean (no secrets / no demo strings) |
| Auth removal regression | `backendAuth.test.ts` TESTS 3/4 assert absence in backend + bundle |
| QA harnesses | Auth/forensic/interaction/mobile/browser updated to credential login + no-shortcut security assert |

## Deploy & post-deploy
- Push commits → Render auto-deploys backend → `npm run deploy:web` → Firebase
  hosting.
- Production smoke: login screen shows no demo/offline buttons; manual login
  works; roster honest; `POST /api/auth/demo-login` returns 404/not found.

See `INVENTORY.md` (full hit-by-hit classifications) and `DATA_MIGRATION.md`
(orphan-demo-user cleanup + legacy entitlement key notes).