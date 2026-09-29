import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens for DOUCSOFT.
 *
 * Every screen pulls colour, spacing and radii from here instead of
 * hardcoding hex values, so a change to the brand colour lands in one
 * place. Spacing is a 4pt scale; `spacing(2)` == 8.
 */

export const colors = {
  // Brand
  primary: '#2563eb',
  primaryDark: '#1e3a8a',
  primaryLight: '#eff6ff',
  primaryBorder: '#bfdbfe',

  // Surfaces
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',

  // Text
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  // Lines
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',

  // Status
  success: '#059669',
  successBg: '#d1fae5',
  warning: '#d97706',
  warningBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerBorder: '#fecaca',

  // Overlays used for image placeholders and skeletons
  skeleton: '#e2e8f0',
  skeletonHighlight: '#f1f5f9',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '700', color: colors.text } as TextStyle,
  title: { fontSize: 22, fontWeight: '700', color: colors.text } as TextStyle,
  heading: { fontSize: 17, fontWeight: '600', color: colors.text } as TextStyle,
  body: { fontSize: 15, fontWeight: '400', color: colors.text } as TextStyle,
  bodyStrong: { fontSize: 15, fontWeight: '600', color: colors.text } as TextStyle,
  caption: { fontSize: 13, fontWeight: '400', color: colors.textSecondary } as TextStyle,
  captionMuted: { fontSize: 13, fontWeight: '400', color: colors.textMuted } as TextStyle,
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary } as TextStyle,
} as const;

/** Elevation that actually reads on both platforms. */
export const shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0f172a',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0f172a',
      shadowOpacity: 0.16,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 8 },
    default: {},
  }) as ViewStyle,
};

export const theme = { colors, spacing, radii, typography, shadow };

export type Theme = typeof theme;
