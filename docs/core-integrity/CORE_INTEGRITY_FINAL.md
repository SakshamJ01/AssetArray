# Core Integrity Final (3.3.x)

## Executive Summary
Foundation-first recovery complete without V4, features, or redesign. One authority per
domain documented (`ENGINE_AUTHORITY_MATRIX.md`); auth/storage/backend/contracts/test
hardened; dead import removed; perf debounced; deterministic CI separated from live smoke.
`npm test` 45 suites pass; `typecheck` 0 errors; `node --check backend/server.js` passes.
Status: CORE INTEGRITY VERIFIED — READY FOR UI/UX TRANSFORMATION (with known limitations).

## Security Remediation
- Git history checked: `backend/.env` never tracked (only `.env.example`); `git log` for env
  files empty. No secret values printed in this work. Local `backend/.env` exists untracked —
  operator must rotate if it ever held prod values.
- `render.yaml`: added `NODE_ENV=production`, explicit CORS allow-list (no `*`), `ADMIN_USERNAME`
  via sync:false. `backend/.env.example` keeps placeholders only.
- `backend/config/env.js` validates prod (`TOKEN/REFRESH_SECRET≥32`, `MONGO_URI`, explicit CORS,
  non-default admin). `validateStartupSecurity` delegates to it.
- CORS: prod allow-list excludes localhost; dev list keeps local ports. Wildcard sanitized with warn.
- Headers: HSTS in production; `x-powered-by` disabled; no stack leaks.

## Secret Rotation
Required if local `backend/.env` or Render dashboard values were ever committed/shared:
Mongo URI, Gemini/API keys, JWT/refresh secrets, admin password. Rotate in Atlas/Render/Google
AI Studio, then redeploy. Do not rewrite shared history blindly.

## Engine Consolidation
- Health/tax were facades (not math duplicates) — confirmed delegates, documented.
- DataQuality: canonical `dataQualityEngine` (bulk snapshot counts); legacy
  `advisor/dataQuality` deprecated, hardcoded 82/96 replaced with honest coverage.
- Market: canonical `UnifiedMarketProvider` + `realTimeMarket` stream; `marketData.ts` deprecated
  shim (SIMULATED fallback). `price:null as any` removed → omitted `price?`; validator treats
  absent as invalid; freshness labels LIVE/DELAYED/STALE/UNAVAILABLE/SIMULATED.
- Terminology: `acquisitionDate` canonical, `acquiredAt` legacy alias (types+tax+backend tolerant).
- Client360/Settings/Workspace duplicates: proven orphaned except CommandPalette (actually wired
  at `AdvisorCommandCenter:806` — prior audit corrected). Only dead `DashboardScreen` import removed;
  `PortfolioManagerSection` double-mount confirmed intentional (contextual per tab).

## Auth
- `verifyToken` try/catch → malformed/invalid/expired/missing all 401, never 500.
- Header-only Bearer (query `?token=` removed). Refresh checks `expiresAt`+revocation+user active,
  rotates (revoke-old → issue-new). Logout revokes where DB available, honest 503 otherwise.
- Backend passwords: per-user random salt for new seeds; legacy `TOKEN_SECRET`-derived hashes still
  verify (backward compat). `pbkdf2Sync` blocking noted as DoS surface (future: async/bcrypt).
- Frontend PIN: `pinCrypto.ts` PBKDF2-100k + salt/IV envelope (`AA1.`), legacy AES fallback;
  brute-force counters + progressive delay + lockout helpers; web auth never auto-succeeds.

## Storage
`STORAGE_CLASSIFICATION.md` is authoritative. Secure downgrades explicit (web warn, native
`__insecure_fallback_` namespace). Cloud ciphertext opaque; ownership server-enforced.

## Backend
- `POST /ai/research` now `requireAuth+requireDb` (503, not 502, when store down).
- `GET /ai/status` authenticated, no internal URLs, Ollama honest `NOT_CONFIGURED`.
- `campaignId` UUID (no ms collision). `findOneAndUpdate` handles mongo v6/v7 shapes.
- `ROUTE_AUTHORITY.md` lists consumer/auth/DB/status; unused advisor/portfolio routes retained as
  deterministic/future (not deleted blindly). Full `routes/middleware/services` split deferred —
  config extracted first per incremental rule.

## Frontend Architecture
- `src/navigation/tabs.ts` canonical tab registry; App uses `VISIBLE_TABS`/`MOBILE_TABS`.
- Screens lazy-mount per `activeTab`; heavy modals mount on open. Modal registry/context extraction
  deferred (god-component reduced, not rewritten).
- `aiStream` evidence typed (`StreamEvidence[]`, no `Record<string,any>`).

## Dead Code
Removed: `DashboardScreen` import. Deprecated: `marketData.ts`, `advisor/dataQuality.ts`.
Proven alive: `CommandPalette`. Orphaned workspace screens documented, files retained (delete after
migration per least-destructive rule).

## Performance
- Persistence debounced 800ms (clients/goals/messages/vault). Market ticks 5s, skip when
  `document.hidden`, only touched symbols update positions. DataQuality bulk counts (no N+1).
- No blind `useMemo` added; profiling still open.

## Testing / CI / E2E / Production Smoke
- `TESTING.md`: `npm test` deterministic (live suites ignored: 45 suites pass incl. new
  `coreIntegrity.test.ts` 4 tests); `npm run test:production` for live; typecheck clean.
- E2E uses `CHROME_PATH/E2E_BASE_URL/E2E_API_URL/E2E_TEST_PIN`; Ollama via fetch+timeout;
  secret scan covers tracked files. `postbuild` guards `dist/` + idempotent marker.
- Open: E2E still creates prod records (`E2E Priya Sharma` quarantine needed); jest still
  `ts-jest+node` (jest-expo migration deferred); express/mongo version skew root-vs-backend open.

## Known Limitations
Backend monolith split incomplete; goal-probability UI audit pending; risk/performance/netWorth
cross-engine golden fixtures pending; E2E isolation incomplete; driver versions unstandardized.

## Handoff
CORE_INTEGRITY_STATUS = READY_FOR_UI_UX (foundation verified; UI transformation may proceed,
fixing only blocking UI bugs until golden workflow re-verified end-to-end).
Remain 3.3.x. No V4.
