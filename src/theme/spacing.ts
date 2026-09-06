export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  card: 8, // Canonical workstation panel radius
  lg: 12,
  xl: 12,
  pill: 999,
} as const;

export const layout = {
  cardPadding: 16,
  cardGap: 12,
  gridGap: 16,
  kpiHeight: 110,
} as const;
