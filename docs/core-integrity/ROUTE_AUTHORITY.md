# Backend Route Authority (3.3.x)

| Route | Consumer | Auth | DB | Status |
|---|---|---|---|---|
| `GET /api/health` | Render HC, smoke | public | no | active |
| `POST /api/auth/login` | `secureSync.loginAdvisor` | public+rate-limit+lockout | required | active |
| `POST /api/auth/refresh` | `secureSync.refreshAdvisorToken` | refresh JWT + expiry+revocation | required | active |
| `POST /api/auth/logout` | `secureSync.logoutAdvisor` | access JWT | required (honest 503 when down, no false success claim) | active |
| `GET /api/auth/me` | `getAdvisorProfile` | access JWT | required | active |
| `POST /api/sync` | `pushPayload` | access + ownership check | required | active |
| `GET /api/sync/:ownerId` | `pullPayload` | access + ownership check | required | active |
| `POST /api/broadcast` | `sendBroadcastCampaign` | access | required | active |
| `GET /api/broadcast/history` | (no frontend caller — desk history UI future) | access | required | retained/future, capped 25 |
| `POST /api/ai/research` | `requestAiResearch` | access | required (503 when store down, not 502) | active |
| `GET /api/ai/status` | AI gateway / settings | access (changed: was public, no URLs leaked) | no | active |
| `POST /api/ai/stream` | AI gateway providers (SSE) | access | no | active |
| `GET /api/audit` | (no frontend caller) | access + `advisor` role | required | retained/audit-only |
| `POST /api/portfolios/attribution|health|tax-harvest|whatif|committee-report` | (no direct frontend caller; local engines mirror math) | access | no | retained/deterministic calculators, future wiring |
| `GET/POST/PATCH /api/advisor/*` (summary/tasks/activity/decisions/opportunities/data-quality/brief) | (partial: CommandCenter uses local engines, not these) | access | mixed (in-memory resilient fallback) | retained/resilient; persistence role documented — memory fallback is per-process and lost on restart |

Ownership: `ownerId` from body is NEVER trusted alone — checked against `req.user.id/username`
except `admin` role. Tokens via `Authorization: Bearer` header only (query `?token=` removed).
Errors: `{ error: string }`, no stack leaks; DB-down is `503 + retryAfterSeconds`.
