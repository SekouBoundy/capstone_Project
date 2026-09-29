import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens for DOUCSOFT.
 *
 * Monochrome, iOS-HIG-flavoured: black on white, one neutral grey ramp,
 * and system colours reserved for status only. There is deliberately no
 * brand accent — emphasis comes from weight and spacing, not hue. That is
 * the Apple approach, and it is why the interface reads as "clean" rather
 * than "colourful".
 *
 * Greys are Apple's semantic label/separator values:
 *   label          #000000
 *   secondaryLabel #6E6E73
 *   tertiaryLabel  #A1A1A6
 *   separator      #E5E5EA
 *   opaqueSeparator#C7C7CC
 *   groupedFill    #F2F2F7
 *
 * Every screen pulls from here. Screens that still hardcode hex values
 * are technical debt — a new screen should import these, never inline a
 * colour.
 */

export const colors = {
  // Emphasis. Black is the accent; there is no blue.
  primary: '#000000',
  primaryDark: '#000000',
  primaryLight: '#F2F2F7',
  primaryBorder: '#D1D1D6',

  // Surfaces
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F2F7',

  // Text
  text: '#000000',
  textSecondary: '#6E6E73',
  textMuted: '#A1A1A6',
  textInverse: '#FFFFFF',

  // Lines
  border: '#E5E5EA',
  borderStrong: '#C7C7CC',

  // Status. Apple system colours, used sparingly and never decoratively.
  success: '#34C759',
  successBg: '#E8F8EE',
  warning: '#FF9500',
  warningBg: '#FFF4E5',
  danger: '#FF3B30',
  dangerBg: '#FFE9E7',
  dangerBorder: '#FFC7C4',

  // Placeholders and skeletons
  skeleton: '#E5E5EA',
  skeletonHighlight: '#F2F2F7',

  // Scrim behind text on top of imagery
  scrim: 'rgba(0, 0, 0, 0.55)',
  scrimStrong: 'rgba(0, 0, 0, 0.72)',
} as const;

/** 4pt scale. `spacing(2)` == 8. */
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

/**
 * Apple ships large titles at 34pt bold. The previous scale topped out at
 * 28, which felt cramped next to the 46pt control row.
 */
export const typography = {
  display: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: 0.37 } as TextStyle,
  title: { fontSize: 22, fontWeight: '700', color: colors.text } as TextStyle,
  heading: { fontSize: 17, fontWeight: '600', color: colors.text } as TextStyle,
  body: { fontSize: 15, fontWeight: '400', color: colors.text } as TextStyle,
  bodyStrong: { fontSize: 15, fontWeight: '600', color: colors.text } as TextStyle,
  caption: { fontSize: 13, fontWeight: '400', color: colors.textSecondary } as TextStyle,
  captionMuted: { fontSize: 13, fontWeight: '400', color: colors.textMuted } as TextStyle,
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary } as TextStyle,
} as const;

/**
 * Apple rarely uses drop shadows; separation comes from hairlines and
 * tonal fills. These are deliberately faint — the `card` level should be
 * felt, not seen.
 */
export const shadow = {
  none: {} as ViewStyle,
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.14,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
};

export const theme = { colors, spacing, radii, typography, shadow };

export type Theme = typeof theme;
