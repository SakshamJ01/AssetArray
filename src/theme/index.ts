import { darkColors, lightColors, terminalColors, ThemeColors } from "./colors";
import { radius, spacing } from "./spacing";
import { typography } from "./typography";

export type ThemeMode = "light" | "dark" | "terminal";

export type AppTheme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: {
    card: {
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: { width: number; height: number };
      elevation: number;
    };
    cardHover: {
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: { width: number; height: number };
      elevation: number;
    };
  };
};

export function buildAppTheme(mode: ThemeMode = "dark"): AppTheme {
  const colors = mode === "terminal" ? (terminalColors as unknown as ThemeColors) : mode === "dark" ? darkColors : lightColors;

  return {
    colors,
    spacing,
    radius,
    typography,
    shadows: {
      card: {
        shadowColor: colors.shadow,
        shadowOpacity: mode === "dark" ? 0.16 : 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      },
      cardHover: {
        shadowColor: colors.shadow,
        shadowOpacity: mode === "dark" ? 0.24 : 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 5,
      },
    },
  };
}

export * from "./appStyles";
export * from "./tokens";

