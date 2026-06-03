import { darkColors, lightColors, ThemeColors } from "./colors";
import { radius, spacing } from "./spacing";
import { typography } from "./typography";

export type ThemeMode = "light" | "dark";

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
  };
};

export function buildAppTheme(mode: ThemeMode): AppTheme {
  const colors = mode === "dark" ? darkColors : lightColors;

  return {
    colors,
    spacing,
    radius,
    typography,
    shadows: {
      card: {
        shadowColor: colors.shadow,
        shadowOpacity: mode === "dark" ? 0.22 : 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      },
    },
  };
}
