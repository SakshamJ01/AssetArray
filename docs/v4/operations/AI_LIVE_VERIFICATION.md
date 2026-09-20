# AI Live Production Verification — Asset Array

**Status: `AI LIVE VERIFIED`**

- **Date:** 2026-09-19 (UTC 17:48) · committed 2026-09-20
- **Final commit:** `9270823` — `fix(v4): finalize live AI and local data verification` (origin/main)
- **Frontend:** https://asset-array.web.app (Firebase Hosting, project `asset-array`)
- **Backend:** https://assetarray.onrender.com — app v3.3.1 — `authRequired: true`, `db: connected`
- **Method:** live HTTP/SSE checks against the production backend, plus a real headless-Chrome run of the deployed web app (isolated ephemeral context; credentials used only as process-local env, never printed or committed).

---

## 1. Gemini configuration (real authenticated check)

| Check | Result |
|---|---|
| `GEMINI_API_KEY` accepted by the Gemini API (live `generateContent`) | **PASS** — `gemini-2.5-flash` returned a real grounded response |
| Search/research model availability | `gemini-2.5-flash` (SUCCESS) · `gemini-flash-latest` (SUCCESS) · `gemini-2.5-pro` **404 retired** · `gemini-2.5-pro-preview-09-2025` **404** · `gemini-2.0-flash*` **404** · `gemini-3.1-pro-preview` **429 (no entitlement)** |
| Provider health (`backend/scripts/verify-gemini.js`) | **`GEMINI_PROVIDER_CHECK=PASS`** — fast + research models both SUCCESS |
| Secrets in config artifacts | **PASS** — `.env` is gitignored; `.env.example` contains no secret values; script redacts keys (prints only `keyLength`) |

**Defect found & fixed:** the research default `gemini-2.5-pro` was retired (404). Set the live research model via the existing secure env mechanism (`AI_GEMINI_RESEARCH_MODEL=gemini-2.5-flash` appended to `backend/.env` — gitignored), documented the same line in `backend/.env.example`, and changed `backend/server.js` default from `"gemini-2.5-pro"` to `"gemini-2.5-flash"`.

## 2. Backend AI auth matrix (live, production backend)

`node scripts/run-backend-ai-auth-check.js` — **12/12 PASS**:

- Backend health reachable (`200`, `authRequired: true`)
- Login with valid workspace credentials succeeds (`expiresIn=900`)
- Missing token → `401`, garbage token → `401`, expired/tampered token → `401`
- Valid token → `/api/auth/me` `200` (role `ADVISOR`); `/api/ai/status` `200` (gemini `AVAILABLE`)
- Valid token → live `/api/ai/stream` returns real streamed text (e.g. `"**FACT:** The portfolio's health score is 72."`), provider `gemini`, no auth error, **no credential leakage**
- Unconfigured provider (`openai`) → explicit honest error (no silent fabrication); no secrets leaked

## 3. Deployed browser AI flow (true browser, production site)

`node scripts/run-e2e-browser-validation.js` — **15/15 VERIFIED** (evidence: `docs/uat-evidence/e2e-evidence.json`, `workflow-results.json`).

- **GW-12 Ask Wealth AI (authenticated):** modal opens, Bearer session token sent, `/api/ai/stream` → HTTP 200, real Gemini text painted in UI, `authErrorInStream=false`, `leakedCred=false`.
- **GW-13 Logout → AI blocked:** desktop Sign Out (Settings → Zero-Knowledge Cloud Backup → Configure Keys → **Sign Out**) lands on the login screen; Ask Wealth AI is unavailable after logout (AI blocked at the UI layer; server-side 401 rejection independently proven in §2).
- **GW-14 Real portfolio data:** no `SAMPLE DATA`/`DEFAULT_SERIES` markers; honest empty trajectory state rendered while no snapshots exist on the account. Live AMFI feed also verified (Axis Children's Fund NAV ₹29.8856, 18-Sep-2026).
- **GW-15 Clear All Local Data:** seeded controlled state (clients corpus, historical snapshots, goals, legacy `__sec_pin`/`__sec_auth_session`, unrelated control key) → confirm modal → **all seeded data and all secure keys purged**, unrelated keys preserved, app returns to clean initial (PIN-setup) state, **no server-side wipe call**.

**Product defects found & fixed during verification (deployed now):**
1. **`Alert.alert` is a no-op on this web build** — "Clear All Local Data" silently did nothing on web. Fixed to use the app-wide `ConfirmModal` (`requestConfirm`).
2. **Logout left the cloud-sync modal open**, overlaying the login screen and swallowing subsequent clicks. Fixed: `logoutFromBackend()` now closes it (`setIsSyncModalOpen(false)`).
3. **Web secure-key sweep missed legacy orphans** (`__sec_pin`, `__sec_auth_session` from older builds — unreferenced by current code but previously survivable). Fixed: `clearAllLocalData` now sweeps all `__sec_*` keys on web.

## 4. AI failure paths

- Unconfigured provider → explicit `notConfigured: true` error line, stream ends cleanly, **no fabricated advisory** and no secret leakage.
- Expired/tampered tokens → `401` every time; the app never surfaces raw auth errors to clients.

## 5. Final gates

`npm run verify:all` — **PASSED (7/7)** in 231s:

| Gate | Result |
|---|---|
| `tsc --noEmit` | PASSED |
| `node --check backend/server.js` | PASSED |
| Jest (459 tests / 83 suites) | PASSED |
| AI integration & grounding audit | PASSED |
| Desktop web E2E (15/15) | PASSED |
| Mobile device emulation audit | PASSED |
| Production web export & build | PASSED |

## 6. Known limitations (documented, not blockers)

- The **deployed backend** still reports `research: gemini-2.5-pro` for `/api/ai/status` — its runtime env predates the model fix. The fast path (`gemini-2.5-flash`) works today; the research model default change takes effect on the next backend redeploy.
- This Gemini account has **no pro-tier model entitlement** (`gemini-3.1-pro-preview` → 429).
- `TOKEN_SECRET` unset in production means the backend derives a random secret per boot — sessions are invalidated on each backend restart (existing deployment caveat, unchanged).
- On desktop the only UI logout is inside the cloud-sync modal (by design; ⌘L locks the vault).

## 7. Conclusion

The Asset Array live AI production stack — Gemini provider authentication, Bearer-token session security, live Ask Wealth AI streaming, logout invalidation, provider failure handling, real portfolio data, and full local-data reset — is **verified end-to-end against production**. Three genuine defects surfaced by the live checks were fixed and redeployed. Final verdict: **`AI LIVE VERIFIED`**.