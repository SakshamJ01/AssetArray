# Testing (3.3.x core-integrity)

- `npm test` — deterministic UNIT only (default CI). Excludes live suites via
  `testPathIgnorePatterns`: `uatEvidenceVerification, productionTruth, marketTruth, workflowIntegrity`.
  No Render/Firebase/AMFI/AI dependency. Currently 45 suites / 246 tests + coreIntegrity (4).
- `npm run test:production` — production smoke (may hit Firebase, Render, AMFI, AI).
  Run manually / nightly, never as CI gate.
- `npm run test:e2e`, `test:e2e:mobile` — Playwright discovery (`CHROME_PATH` optional),
  URLs via `E2E_BASE_URL`/`E2E_API_URL`, PIN via `E2E_TEST_PIN`. No hardcoded prod writes;
  E2E records must use isolated tenant (open item: `E2E Priya Sharma` still created — quarantine).
- `npm run test:ai:integration` — provider matrix (Gemini/Ollama/OpenAI/Anthropic) with
  `NOT_CONFIGURED` when absent; Ollama detected via fetch+timeout (no curl assumption);
  secret scan covers tracked `src`/`backend` files, names only.
- `npm run typecheck` — `tsc --noEmit`, 0 errors required.
- Backend: `node --check backend/server.js` + `backend/config/env.js` validation.
  Prod startup with missing secrets fails safely (`validateEnv`).

Labels: UNIT (default), INTEGRATION (DB-gated), CONTRACT (schema), E2E, PRODUCTION_SMOKE.
Tests never write docs/prod state unless explicitly production-smoke.
