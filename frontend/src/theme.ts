// Design tokens for EmotiCoach Kids. Light theme (warm/playful).
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces
  surface: "#FDFBF7",
  onSurface: "#264653",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#264653",
  surfaceTertiary: "#F2ECE4",
  onSurfaceTertiary: "#4A6572",
  surfaceInverse: "#2A9D8F",
  onSurfaceInverse: "#FFFFFF",
  muted: "#8A9A9E",

  // Brand
  brand: "#F4A261",
  onBrand: "#FFFFFF",
  brandPrimary: "#E76F51",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#E9C46A",
  onBrandSecondary: "#264653",
  brandTertiary: "#2A9D8F",
  onBrandTertiary: "#FFFFFF",

  // Status
  success: "#2A9D8F",
  onSuccess: "#FFFFFF",
  warning: "#E9C46A",
  onWarning: "#264653",
  error: "#E76F51",
  onError: "#FFFFFF",
  info: "#4A6572",
  onInfo: "#FFFFFF",

  // Lines
  border: "#E8E2D9",
  borderStrong: "#D4C9BA",
  divider: "#E8E2D9",

  // Kids palette: bright, saturated playful accents (text on them uses onKid)
  kidPink: "#FF6FA5",
  kidSky: "#3DB4F2",
  kidLime: "#7ED957",
  kidOrange: "#FF9F1C",
  kidSun: "#FFD23F",
  kidMint: "#2EC4B6",
  kidCoral: "#FF6B6B",
  kidBerry: "#E84393",
  onKid: "#FFFFFF",
  onKidLight: "#3A2E1F",
};

export type ThemeColors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
export const radius = { sm: 8, md: 16, lg: 24, pill: 999 };

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "light" || system === "dark" ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const colors = light;
