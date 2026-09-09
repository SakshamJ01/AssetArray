# Authentication (3.3.x)

Production authentication is a single, real, credential-held path. There is no
demo login, no offline bypass, and no synthetic session in the shipped product.

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

## Restrictions
- `GET /api/audit` is advisor-only.
- Sync ownership is enforced per identity; no account can read another's blob.
- No passwordless, demo, or offline authentication endpoint exists on the
  backend (`POST /api/auth/demo-login` was removed in 3.3.x). Any client that
  attempts it receives 404.

## Environment
`ADMIN_USERNAME` / `ADMIN_PASSWORD` (server only, never `EXPO_PUBLIC_*`).
Production rejects default admin password at startup.

## Manual verification (live)
Backend `/api/health` → `authRequired:true`. Logout → login screen. Manual valid
login → connected; wrong password → "Login failed". Full login/logout/refresh/
token-matrix covered by `__tests__/backendAuth.test.ts` and
`scripts/run-auth-browser-validation.js`.