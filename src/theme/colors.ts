export const lightColors = {
  background: "#F8F9FA", // Luxurious cream ivory
  backgroundMuted: "#F1F4F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  surfaceStrong: "#EEF2F6",
  border: "rgba(179, 126, 40, 0.22)", // Warm antique gold hairline
  borderStrong: "rgba(179, 126, 40, 0.42)",
  textPrimary: "#0A0F1D", // Crisp midnight sapphire
  textSecondary: "#334155",
  textMuted: "#64748B",
  textOnBrand: "#FFFFFF",
  brand: "#B37E28", // Refined Swiss private bank gold
  brandStrong: "#94651B",
  accent: "#0D9488", // Deep emerald teal
  accentSoft: "rgba(13, 148, 136, 0.12)",
  danger: "#E11D48",
  dangerSoft: "rgba(225, 29, 72, 0.10)",
  warning: "#B37E28",
  warningSoft: "rgba(179, 126, 40, 0.12)",
  neutral: "#64748B",
  neutralSoft: "#F1F5F9",
  overlay: "rgba(15, 23, 42, 0.4)",
  shadow: "rgba(15, 23, 42, 0.08)", // Softer shadow for human-centered executive feel
  success: "#10B981",
  successSoft: "rgba(16, 185, 129, 0.12)",
  cardHover: "#F8FAFC",
  cardElevation: "rgba(255, 255, 255, 0.92)",
  borderSubtle: "rgba(179, 126, 40, 0.12)",
};

export const darkColors = {
  background: "#030712", // Rich obsidian black
  backgroundMuted: "#080d1a",
  surface: "#0d1424", // Velvet sapphire charcoal
  surfaceMuted: "#131c30",
  surfaceStrong: "#1b2742",
  border: "rgba(224, 168, 76, 0.22)", // Subtle champagne gold border
  borderStrong: "rgba(224, 168, 76, 0.45)",
  borderSubtle: "rgba(224, 168, 76, 0.12)",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  textOnBrand: "#030712",
  brand: "#e0a84c", // Radiant warm gold
  brandStrong: "#c89134",
  accent: "#10b981",
  accentSoft: "rgba(16, 185, 129, 0.15)",
  danger: "#f43f5e",
  dangerSoft: "rgba(244, 63, 94, 0.15)",
  warning: "#e0a84c",
  warningSoft: "rgba(224, 168, 76, 0.15)",
  neutral: "#94a3b8",
  neutralSoft: "#131c30",
  overlay: "rgba(0, 0, 0, 0.75)",
  shadow: "rgba(0, 0, 0, 0.45)",
  success: "#10B981",
  successSoft: "rgba(16, 185, 129, 0.15)",
  cardHover: "#121b30",
  cardElevation: "rgba(13, 20, 36, 0.88)",
};

export const terminalColors = {
  background: "#060a12", // High-density Bloomberg / Aladdin terminal slate
  backgroundMuted: "#0a101d",
  surface: "#0f172a", // Deep slate
  surfaceMuted: "#141f36",
  surfaceStrong: "#1b2a47",
  border: "rgba(0, 229, 163, 0.22)", // Precision terminal emerald hairline
  borderStrong: "rgba(0, 229, 163, 0.45)",
  borderSubtle: "rgba(0, 229, 163, 0.12)",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  textOnBrand: "#060a12",
  brand: "#00e5a3", // Electric terminal alpha emerald
  brandStrong: "#00b37e",
  accent: "#38bdf8", // Terminal cyan
  accentSoft: "rgba(56, 189, 248, 0.15)",
  danger: "#f43f5e",
  dangerSoft: "rgba(244, 63, 94, 0.15)",
  warning: "#fbbf24",
  warningSoft: "rgba(251, 191, 36, 0.15)",
  neutral: "#94a3b8",
  neutralSoft: "#141f36",
  overlay: "rgba(0, 0, 0, 0.8)",
  shadow: "rgba(0, 0, 0, 0.5)",
  success: "#00e5a3",
  successSoft: "rgba(0, 229, 163, 0.15)",
  cardHover: "#14213a",
  cardElevation: "rgba(15, 23, 42, 0.95)",
};

export type ThemeColors = typeof lightColors;
