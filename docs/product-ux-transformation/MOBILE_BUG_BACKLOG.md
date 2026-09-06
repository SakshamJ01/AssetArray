# AssetArray Mobile Bug Backlog

**Release Family:** 3.3.x  
**Target Viewports:** iPhone 13 (390 × 844 px) & Pixel 7 (412 × 915 px)  

---

## 1. Resolved Mobile Backlog

| Bug ID | Screen | Viewport | Severity | Root Cause | Implemented Resolution | Status |
|:---|:---|:---:|:---:|:---|:---|:---:|
| **MOB-01** | Client 360 Holdings Table | 390 × 844 | **P1 (High)** | 7 desktop columns squeezed into flex row, truncating security names and prices. | Wrapped table in horizontal `ScrollView` with `minWidth: 640` and dynamic currency formatting. | **RESOLVED** |
| **MOB-02** | LockScreen PIN Keypad | 390 × 844 | **P2 (Medium)** | Outer card used excessive `borderRadius: 28` taking up vertical viewport. | Reduced container radius to canonical `12`, ensuring keypad is reachable without scrolling. | **RESOLVED** |
| **MOB-03** | Bottom Navigation Bar | 412 × 915 | **P2 (Medium)** | Fixed bottom bar used `borderRadius: 18` with heavy dropshadow. | Standardized radius to `12` with subtle elevation and safe-area inset protection. | **RESOLVED** |
| **MOB-04** | Portfolios Screen Allocation Bar | 390 × 844 | **P2 (Medium)** | Multiple nested card wrappers caused excessive whitespace on small mobile screens. | Extinguished inner cards into clean inline allocation segments. | **RESOLVED** |
| **MOB-05** | Tax Harvesting Studio Modal | 390 × 844 | **P2 (Medium)** | Centered desktop dialog clipped primary CTA button on short viewports. | Converted modal into full-screen responsive sheet with sticky bottom action trigger. | **RESOLVED** |
| **MOB-06** | AI Research Citation Cards | 412 × 915 | **P3 (Polish)** | Source URLs and dates wrapped unpredictably inside pill borders. | Formatted into clean, single-line truncated rows with tap-to-expand details. | **RESOLVED** |

---

## 2. Mobile Regression Verification

- **Automated Viewport Assertion:** `scripts/run-mobile-e2e-validation.js` executes 14 device emulation passes with zero horizontal overflow violations (`document.documentElement.scrollWidth <= window.innerWidth`).
- **Touch Target Integrity:** All interactive buttons maintain $\ge 44\text{px} \times 44\text{px}$ touch targets.
