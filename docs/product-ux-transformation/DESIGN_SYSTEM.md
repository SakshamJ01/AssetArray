# AssetArray Institutional Design System (3.3.x)

**Status:** Canonical Release Standard  
**Philosophy:** Private-bank discipline + Trading-terminal efficiency + Modern fintech usability  
**Guiding Benchmark:** Zerodha/Kite dense contextual simplicity, Nuvama multi-client wealth management, institutional Bloomberg-tier typography.  

---

## 1. Core Principles

1. **Context $\rightarrow$ Priority $\rightarrow$ Action $\rightarrow$ Detail:** Information is revealed in an intentional fiduciary hierarchy rather than exposing every metric simultaneously.
2. **Dense, Calm, and Quiet:** High informational density without visual noise. Eliminates decorative card grids, bubbly pills, and distracting animations.
3. **Numbers Visually Dominate:** Financial metrics (e.g. ₹4.82 Cr, +14.2% YTD) dominate labels, utilizing tabular numerals (`fontVariant: ['tabular-nums']`).
4. **Color Trust:** Colors are strictly semantic (positive, negative, warning, neutral, stale, simulated). Financial states never rely on color alone (e.g. `↑ +4.2% POSITIVE`).

---

## 2. Radius System

Strictly canonical tokens. Irregular radii (14, 16, 18, 20, 22, 24, 28, 32) are banned.

| Token Name | Value | Usage Context |
|:---|:---:|:---|
| `radius.none` | `0px` | Data tables, section dividers, edge-to-edge panes |
| `radius.sm` | `4px` | Badges, status tags, micro-indicators |
| `radius.input` | `6px` | Text inputs, dropdown selectors, pill chips |
| `radius.card` | `8px` | KPI stat panels, workspace sections, client rows |
| `radius.modal`| `12px`| High-level modals, bottom sheets, mobile nav bar |
| `radius.pill` | `999px`| Circular client avatars only |

---

## 3. Elevation & Border System

Card-in-card stacking is eliminated. Visual separation is accomplished primarily through subtle hairline borders and background tonal tiers.

- **Border Hairline:** `1px solid rgba(255, 255, 255, 0.08)` (Neutral panel separation)
- **Border Default:** `1px solid rgba(255, 255, 255, 0.12)` (Interactive cards, inputs)
- **Border Gold:** `1px solid rgba(224, 168, 76, 0.22)` (Institutional accent hairline)
- **Shadow Minimal:** `shadowOpacity: 0.16, shadowRadius: 4, elevation: 1` (Subtle elevation only; no heavy floating dropshadows)

---

## 4. Typography Hierarchy & Tokens

Implemented in [`src/theme/tokens.ts`](file:///c:/Users/Saksham/Documents/New%20project/src/theme/tokens.ts):

| Token | Size / LineHeight | Weight | Tracking | Primary Use |
|:---|:---:|:---:|:---:|:---|
| `display` | 26 / 32px | Bold (700) | -0.5px | LockScreen, top-level portfolio valuation |
| `pageTitle` | 20 / 26px | Bold (700) | -0.3px | Screen headers, modal titles |
| `sectionTitle` | 15 / 20px | Semi (600) | -0.1px | Section dividers, table category headers |
| `metricLarge` | 28 / 34px | Bold (700) | -0.5px | Hero KPI numbers (e.g. ₹1.50 Cr) |
| `metric` | 18 / 24px | Bold (700) | -0.2px | Grid KPI numbers, table sub-totals |
| `body` | 13 / 18px | Regular (400) | Normal | Primary descriptive content, table rows |
| `bodySmall` | 12 / 16px | Regular (400) | Normal | Metadata, holding ticker, timestamps |
| `label` | 11 / 14px | Semi (600) | +0.4px | Table column headers, uppercase field labels |
| `caption` | 11 / 14px | Regular (400) | Normal | Footnotes, regulatory disclosures |

---

## 5. Semantic Color Tokens

```typescript
export const semanticStatusColors = {
  positive: "#10B981",       // Gain, active, bullish
  positiveMuted: "rgba(16, 185, 129, 0.14)",
  negative: "#EF4444",       // Loss, breach, critical alert
  negativeMuted: "rgba(239, 68, 68, 0.14)",
  warning: "#F59E0B",        // Caution, drift, lot review
  warningMuted: "rgba(245, 158, 11, 0.14)",
  info: "#06B6D4",           // General indicator, active tab
  infoMuted: "rgba(6, 182, 212, 0.14)",
  neutral: "#94A3B8",        // Inactive, secondary meta
  neutralMuted: "rgba(148, 163, 184, 0.10)",
  stale: "#D97706",          // Delayed feed, older than 15 min
  simulated: "#6366F1",      // Paper trade, test sandbox
  simulatedMuted: "rgba(99, 102, 241, 0.14)",
};
```

---

## 6. Table & Responsive Data Layout Strategy

1. **Desktop ($> 1024\text{px}$):**
   - Full tabular layout using semantic headers and right-aligned decimal numbers.
   - Column priority: `Asset` $\rightarrow$ `Qty` $\rightarrow$ `Avg Cost` $\rightarrow$ `CMP` $\rightarrow$ `Value` $\rightarrow$ `Weight` $\rightarrow$ `P&L` $\rightarrow$ `Drift`.
2. **Mobile ($\le 640\text{px}$):**
   - Wrapped in dedicated horizontal `ScrollView` with `minWidth: 640`, or stacked position row displaying: `Asset`, `Value`, `P&L (%)`, `Weight`, with tap-to-expand details.
   - Zero horizontal page overflow guaranteed.
