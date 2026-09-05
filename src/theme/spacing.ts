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
  sm: 8,
  md: 12,
  card: 14, // Standardized softer card radius for cohesive executive dashboards
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const layout = {
  cardPadding: 16,
  cardGap: 12,
  gridGap: 16,
  kpiHeight: 110,
} as const;
