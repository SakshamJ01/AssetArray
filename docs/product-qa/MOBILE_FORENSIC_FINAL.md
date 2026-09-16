# AssetArray — Mobile Forensic & Responsive Layout Report

**Release Family**: 3.3.x  
**Tested Viewports**: `360×800` (Small Mobile), `390×844` (iPhone 13), `412×915` (Pixel 7), `768×1024` (Tablet), `1440×900` (Desktop)  

---

## Viewport & Layout Audit

| Screen / Modal | Viewport | Target Bounds | Layout Behavior | Vertical Collapse Check | Touch Target Audit (≥ 44px) | Result |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: |
| **Login / Lock Gate** | 360x800 | Full Viewport | Centered card, auto-scaling inputs | NO | PASS | **PASS** |
| **Command Center** | 390x844 | Scroll View | Card padding 16px, dense metric rows | NO | PASS | **PASS** |
| **Clients Screen** | 390x844 | Scroll View | Client card stack, responsive badge alignment | NO | PASS | **PASS** |
| **Client 360** | 412x915 | Scroll View | Multi-column grid wraps cleanly on mobile | NO | PASS | **PASS** |
| **Portfolios Screen** | 390x844 | Scroll View | Holdings cards adapt, horizontal scroll on tables | NO | PASS | **PASS** |
| **Risk Screen** | 390x844 | Scroll View | Charts scale dynamically without overflow | NO | PASS | **PASS** |
| **Tax Screen** | 412x915 | Scroll View | STCG / LTCG tables use responsive horizontal scroll | NO | PASS | **PASS** |
| **Goals Screen** | 390x844 | Scroll View | Monte Carlo progress bars scale to screen width | NO | PASS | **PASS** |
| **Scenarios Screen** | 360x800 | Scroll View | Shock sliders remain keyboard-aware and visible | NO | PASS | **PASS** |
| **Research Desk** | 390x844 | Scroll View | Search inputs follow focus; keyboard dismiss works | NO | PASS | **PASS** |
| **Attribution Modal** | 390x844 | Modal overlay | Dynamic height container, scrollable contents | NO | PASS | **PASS** |
| **Client Editor Modal** | 360x800 | Modal overlay | Inputs stack vertically, action buttons stick to footer | NO | PASS | **PASS** |

---

## Defensive Styling Rules Verified
1. **Flex Wrap & Min Widths**: Flex containers enforce explicit `flexWrap: "wrap"` and `minWidth` bounds to eliminate single-character vertical text stacking.
2. **Keyboard Focus Tracking**: Text inputs shift appropriately when soft keyboard triggers, ensuring submit buttons remain reachable.
3. **No Decorative Overlays**: Floating AI FAB respects safe area insets and hides during modal dialog presentation.
