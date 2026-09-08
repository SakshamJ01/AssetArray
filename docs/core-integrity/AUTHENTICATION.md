# Authentication: Normal, Demo, Offline (3.3.x)

Three explicitly separated modes. Demo authentication is NOT production
administrator authentication.

## NORMAL LOGIN (advisor)
UI: login screen → username + password → "Sign In".
Path: `loginToBackend()` → `loginAdvisor()` → `POST /api/auth/login`
→ per-user salt PBKDF2 verification → access (15m) + rotating refresh (30d)
tokens → session persisted (SecureStore / web storage) → `Connected as <user>`.
Codes: 200 valid · 401 wrong credentials · 400 missing fields · 429 locked ·
503 DB unavailable. Admin identity comes from `ADMIN_USERNAME`/`ADMIN_PASSWORD`
server env only. On boot the server repairs ONLY the dedicated admin record when
the configured password no longer matches (rotation/stale-record recovery);
no other user is touched and nothing is deleted.

## DEMO LOGIN (isolated demo workspace)
UI: "1-Click Demo Sign In". No password exists anywhere in the frontend.
Path: `quickDemoLogin()` → `demoLoginAdvisor()` → `POST /api/auth/demo-login`
with an empty body → backend checks `DEMO_AUTH_ENABLED=true` → mints normal
tokens for the dedicated demo identity (`DEMO_USERNAME`, role `"demo"`).
Codes: 200 enabled+available · 403 demo disabled · 503 demo identity unavailable.
Restrictions: role `"demo"` is excluded from `GET /api/audit` (advisor-only);
sync ownership is enforced per identity, so demo data cannot touch admin blobs.
The demo password is a random unusable value that is never exposed.

## OFFLINE DEMO MODE
UI: "Continue in Offline Mode (Demo)". Purely local synthetic session
(`advisor-offline`); no backend contact, local storage only. Clearly labeled
offline — it never claims server authentication.

## Environment
`ADMIN_USERNAME` / `ADMIN_PASSWORD` (server only, never `EXPO_PUBLIC_*`),
`DEMO_AUTH_ENABLED` (`"true"` to allow demo), `DEMO_USERNAME` (must differ
from `ADMIN_USERNAME`). Production rejects default admin password and
`DEMO_USERNAME`/`ADMIN_USERNAME` collisions at startup. `render.yaml`
declares demo on explicitly; for an existing Render service the same keys
must also be set in the Render dashboard (dashboard values win).

## Manual verification (live)
Backend `/api/health` → `authRequired:true`. Demo button → demo workspace →
Logout → login screen. Manual valid login → connected; wrong password →
"Login failed". Full login/logout/refresh/token-matrix covered by
`__tests__/backendAuth.test.ts` and `scripts/run-auth-browser-validation.js`.
