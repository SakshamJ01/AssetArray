# AssetArray Responsive & Interaction QA Report (3.3.x)

**Date:** 2026-09-09
**Branch:** `main` (working tree ahead of `47d1980`)
**Target:** `http://localhost:3000/` (local `dist` export), `STUB_AUTH=1` (auth endpoints fulfilled locally so geometry/behavior QA is isolated from the cross-origin backend; live backend truth covered by unit + contract tests).
**Engine:** `scripts/run-forensic-qa.js` + `scripts/run-interaction-qa.js` (Playwright-core, system Chrome via `CHROME_PATH`).

---

## 1. Executive Summary

- **Forensic QA:** 53 tab-scans across 7 viewports (360x800 → 1440x900, mobile + tablet + desktop, selected-client states included). **0 P0, 0 P1 findings.** 15 P2 findings remain (12 cosmetic right-bleeds inside a vertical-scrolling section; 3 touch-targets at 32x35 on the Client 360 close button).
- **Interaction QA:** 32/32 behavioral checks pass on 1440x900 and 390x844 (auth, client CRUD, holding add + P&L, confirm-modal delete cancel/confirm, goal persistence across reload, SIP calculator, command palette Escape, workspace nav, logout).
- **Unit/Tooling gates:** 47 Jest suites / 263 tests pass; `tsc --noEmit` clean; `build:web` exports; backend syntax `--check` clean (excluding vendored `node_modules`); production bundle secret scan 0 hits.
- **Net effect this session:** the 1024x768 tablet text-collapse regression (P0) and the mobile Client-360 tier-pill overflow (P1) are resolved at the root cause.

---

## 2. Forensic Responsive Audit

### 2.1 Findings by severity
| Severity | Count | Kind |
|---|---|---|
| P0 | 0 | — |
| P1 | 0 | — |
| P2 | 15 | right-bleed ×12, touch-target ×3 |

### 2.2 Root causes fixed this session
| Regression | Root cause | Fix |
|---|---|---|
| 1024x768 tablet text-collapse (P0, 37 findings) | 78px roster selector pill + unsheddable `clientRow` starved text into per-character vertical stacks | `selectorPill` 78→30px with `flexShrink:0`; `clientRow` `minWidth:0` (`src/theme/appStyles.ts`) |
| 360/390/412 arrow push of “TIER 1 HNI” offscreen (P1, 2 findings) | Client 360 identity-row name block kept `flex:0 0 auto` (max-content), shoving the tier pill past the modal container; pill clipped by `overflow:hidden` ScrollView | `identityNameBlock` → `flex:1, minWidth:0`; name text `flexShrink:1, minWidth:0`; tier pill `flexShrink:0` (`src/features/advisor/Client360Modal.tsx`) |
| 390x844 evidence-row text collapse (P0) | 6-cell single-line evidence table with `flex:1` on every cell fell below readable glyph width on mobile | `evidenceTable`→`flexWrap:"wrap"` + `rowGap/columnGap`; `evidenceCell`→`flexGrow:1, flexShrink:1, flexBasis:90, minWidth:0` (`src/components/client360/Client360Workspace.tsx`) |
| Global-status-bar crush to zero width (390x844 client name w=0) | PORTFOLIO + AS OF + 4 context shortcuts shared the 34px bar with the client segment below 1280px | Progressive disclosure: PORTFOLIO/shortcuts only ≥1280px (`roomy`), AS OF hidden <560px (`compact`); `contextItem` `flexShrink:1, minWidth:0` (`src/components/GlobalStatusBar.tsx`) |
| Touch-target P2 (close x 32x35) | Icon button laid out from padding only | `closeButton` → fixed 44x44 centered (`Client360Modal.tsx`) |

### 2.3 Remaining P2 description (accepted)
- **right-bleed ×12:** `CLIENT INSIGHT ENGINE` header + its meta line render at `right≈536px` (mobile) / `1056px` (1024 tablet) inside the Client-360 workspace section. These live in a vertical `ScrollView` (content wider than the clipped viewport), are unreachable horizontally on-page, and do not extend the page scroll width. Cosmetic; deferred.
- **touch-target ×3:** duplicate of the Client-360 close button metric being re-scanned per viewport; now fixed to 44x44, pending re-scan.

---

## 3. Interaction QA (behavioral, state-change asserted)

| # | Check | Status |
|---|---|---|
| AUTH-01 | demo login reaches workspace | ✅ |
| CLIENT-01 | empty client rejected, modal stays open | ✅ |
| MODAL-01 | Escape closes client editor | ✅ |
| CLIENT-02 | created client appears in roster | ✅ |
| CLIENT-3x | select + 360 workspace reachable | ✅ |
| HOLD-01/02/03 | holding add, P&L derivation (+2500/25%), row interactive | ✅ |
| DEL-01/02/03 | confirm modal appears; cancel keeps client; confirm deletes | ✅ |
| GOAL-01 / persist-01 | goal form reachable (mobile via Goals Planner chip); goal survives reload | ✅ |
| CALC-01 | SIP calculator renders without NaN | ✅ |
| PAL-01 | command palette opens, Escape closes | ✅ |
| NAV-01 | workspace reachable | ✅ |
| AUTH-02 | logout returns to lock/login | ✅ |

Viewports: `1440x900`, `390x844`. Results recorded via `scripts/run-interaction-qa.js` (report `INTERACTION_REPORT`, default `%TEMP%\interaction-qa.json`).

---

## 4. Regression, Type & Build Gates

- Jest: **47 suites / 263 tests pass** (`AssertionError` count 0).
- Typecheck: `tsc --noEmit` — 0 errors.
- Web build: `expo export -p web` + `scripts/postbuild.js` — succeeds, PWA assets injected.
- Backend: `node --check` passes for all `backend/*.js` excluding vendored `node_modules`.
- Secrets scan of `dist/**` (js/html): 0 hits for `AssetArrayLocalAdmin`, `ChangeMeNow123`, `ADMIN_PASSWORD`, `TOKEN_SECRET`, `REFRESH_SECRET`, `MONGO_URI`.

---

## 5. Evidence files
- Forensic report: `%TEMP%\forensic-qa.json` (53 scans); screenshots `%TEMP%\forensic-shots\`.
- Interaction report: `%TEMP%\interaction-qa.json` (32 checks).

## 6. Known limitations
- Forensic runs against the local export with stubbed auth (API truth separately covered by backend unit + contract tests).
- Remaining P2s are cosmetic and confined to a scrolling section; no page-level overflow.
- No native/iOS runtime available; web build is the verified target.