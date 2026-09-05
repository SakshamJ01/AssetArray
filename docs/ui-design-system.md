# AssetArray — Institutional UI Design System Specification

## 1. Information Architecture & Philosophy
AssetArray is an institutional private wealth workstation. It avoids gimmicky consumer fintech aesthetics (excessive floating cards, heavy glowing drop shadows, oversized rounded corners, saturated primary colors) in favor of restrained Swiss private banking standards:
- **Table-First Financial UI**: Dense, tabular financial metrics with precision.
- **Section & Divider Architecture**: Replaces nested card clusters with clean page sections, hairline dividers (`1px solid rgba(255,255,255,0.08)` / `rgba(15,23,42,0.08)`), and inline metric bars.
- **Context Preservation**: Active client and active portfolio remain permanently visible across navigation transitions.

---

## 2. Design Tokens

### A. Border Radius
Restrained radii for structural precision:
- `radius-none`: `0px` (tables, flush dividers, status bars)
- `radius-sm`: `4px` (badges, pills, table chips, input controls)
- `radius-md`: `8px` (action buttons, metric panels, modal containers)
- `radius-lg`: `12px` (primary workbench panels, modal frames)
- **Rule**: Avoid `20px+`, `24px+`, or `32px+` on structural content.

### B. Elevation & Shadows
- **Dark Mode**: Zero heavy drop shadows. Contrast is achieved through subtle surface differentiation (`#030712` canvas, `#070D1B` section, `#0F172A` control) and `1px` subtle borders.
- **Light Mode**: Single hairline border with `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)`. Floating card glows are strictly prohibited.

### C. Color Palette
- **Canvas Dark**: `#030712` (Executive Obsidian)
- **Surface Dark**: `#070D1B` (Deep Navy Tint)
- **Control Dark**: `#0F172A` (Slate Container)
- **Border Dark**: `rgba(255, 255, 255, 0.08)` / `rgba(224, 168, 76, 0.25)` (Brand Hairline)
- **Canvas Light**: `#F8FAFC`
- **Surface Light**: `#FFFFFF`
- **Brand Accent**: `#E0A84C` (Fiduciary Gold)
- **Positive / Alpha**: `#10B981` (Emerald)
- **Negative / Drawdown**: `#EF4444` (Crimson)
- **Neutral / Informational**: `#3B82F6` (Cobalt)

### D. Typography Hierarchy
Financial values demand tabular precision:
- **Micro Label / Eyebrow**: `10px - 11px`, uppercase, tracking `0.6px - 1.0px`, font weight `600 - 700`, muted text color (`#64748B` / `#94A3B8`).
- **Primary Number / Valuation**: `22px - 28px`, tabular numerals, font weight `700`, primary text color (`#F8FAFC` / `#0F172A`).
- **Delta Indicator**: `11px - 12px`, tabular numerals, font weight `600`, enclosed in subtle pill badge with direction arrow.
- **Body & Table Text**: `12px - 13px`, line-height `18px`, clean sans-serif.

---

## 3. Component Standards

### A. Tables
- **Holdings Table**: `Asset | Qty | Price | Value | Weight | P&L Day | Target | Drift`
- **Advisor Priorities Table**: `Priority | Client | Issue | Evidence | Due | Status | Action`
- Headers: `11px` uppercase tracking, subtle background shading, bottom hairline border.
- Rows: `36px - 44px` height, hover state (`rgba(255,255,255,0.03)`), right-aligned numerical values.

### B. Global Status Bar
Every screen displays consistent top metadata:
`Client: [Active Client] | Portfolio: [Active Portfolio] | As of: [Timestamp] | Market: [LIVE / SIM] | Data Quality: [XX%]`

### C. Primary Navigation (10 Core Workspaces)
1. **Command Center** (`DashboardScreen.tsx`)
2. **Clients** (`ClientsScreen.tsx` — Client 360 Workspace)
3. **Portfolios** (`PortfoliosScreen.tsx`)
4. **Markets** (`LiveMarketTicker.tsx`, `LiveMarketDepthModal.tsx`)
5. **Goals** (`Goals` modal / section)
6. **Risk & Tax** (`TaxHarvestStudioModal.tsx`, `ScenarioSandboxModal.tsx`, `AttributionModal.tsx`)
7. **Research** (`AiResearchScreen.tsx`)
8. **Reports** (`pdfReport.ts`, `CommitteeMemoModal.tsx`)
9. **Workspace** (`WorkspaceScreen.tsx`)
10. **Settings** (`SettingsScreen.tsx`)

### D. Button Integrity
Every button performs one of the following explicit operations:
`NAVIGATE | SUBMIT | SAVE | OPEN | EXPORT | REFRESH | TOGGLE | COPY | DELETE | FILTER | SEARCH | RETRY`
Dead buttons or cosmetic badges masquerading as interactive controls are strictly forbidden.
