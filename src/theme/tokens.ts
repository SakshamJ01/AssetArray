/**
 * AssetArray Canonical Financial Workstation Design Tokens
 * Follows private-bank discipline, trading-terminal density, and modern fintech usability.
 * Strictly avoids: bubbly cards, excessive gradients, oversized radii, and decorative clutter.
 */

export const radiusTokens = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  // Alias mappings to prevent random 18, 20, 24, 32 radii
  card: 8,
  panel: 8,
  button: 6,
  input: 6,
  badge: 4,
  modal: 12,
  table: 0,
} as const;

export const shadowTokens = {
  none: {
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  subtle: {
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  modal: {
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const borderTokens = {
  hairline: "1px solid rgba(255, 255, 255, 0.08)",
  default: "1px solid rgba(255, 255, 255, 0.12)",
  strong: "1px solid rgba(255, 255, 255, 0.20)",
  goldHairline: "1px solid rgba(224, 168, 76, 0.22)",
  goldStrong: "1px solid rgba(224, 168, 76, 0.45)",
} as const;

export const typographyTokens = {
  display: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  pageTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600" as const,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
  },
  metricLarge: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
  metric: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.2,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "400" as const,
  },
} as const;

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
} as const;

export const spacingTokens = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const surfaceTokens = {
  background: "#030712",
  surface: "#0B1222",
  surfaceMuted: "#101B30",
  surfaceSubtle: "#16233B",
  borderHairline: "rgba(255, 255, 255, 0.08)",
  borderDefault: "rgba(255, 255, 255, 0.12)",
  brand: "#E0A84C",
  brandMuted: "rgba(224, 168, 76, 0.14)",
} as const;
