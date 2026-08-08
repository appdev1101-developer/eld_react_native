import { THEME } from './Theme';

const COLORS = {
  light: {
    primaryThemeColor: THEME.colors.primary,
    secondaryThemeColor: THEME.colors.surface,
    pageBackgroundColor: THEME.colors.surfaceMuted,
    headerColor: THEME.colors.surface,
    bottomTabColor: THEME.colors.primary,
    primaryFontColor: THEME.colors.textPrimary,
    secondaryFontColor: THEME.colors.textSecondary,
    buttonColor: THEME.colors.primary,
    cardColor: THEME.colors.surface,
    accentColor: THEME.colors.accent
  }
} as const; // <-- 'as const' ensures strict, read-only string literal types

// Optional: Creates a type alias you can reuse elsewhere if needed
export type AppColors = typeof COLORS;

export { COLORS, THEME };
