/**
 * GAINLY design tokens — the single, rendering-free source of truth.
 *
 * Transcribed verbatim from docs/design-system.md (§2 color, §3 type, §4 spacing/radii/
 * elevation/motion). Do NOT re-derive values here — this file mirrors that doc, and the doc's
 * computed WCAG contrast table is what makes the pairings safe. Change the doc first, then here.
 *
 * This module renders nothing. It is imported by the web components in this package AND is the
 * intended source for the RN theme (apps/mobile/src/constants/theme.ts) and web's tailwind config,
 * so a token value only ever lives in one place (design-system.md §8 sharing boundary).
 */

/** Raw ramps — reference by role token below, not by ramp name, in product code (§2). */
export const palette = {
  green: {
    50: '#EAF9EF',
    100: '#CFF2DA',
    200: '#A3E6BB',
    300: '#6FD494',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F7F8F7',
    100: '#EEF0EE',
    200: '#E4E7E3',
    300: '#C3C9C0',
    400: '#9AA69F',
    500: '#717A71',
    600: '#545C54',
    700: '#4B534D',
    800: '#333933',
    900: '#242824',
  },
  darksurf: { base: '#0F1211', 1: '#171A18', 2: '#1F2321', 3: '#262B27' },
  red: { 400: '#F87171', 600: '#DC2626', 700: '#B91C1C' },
  amber: { 400: '#FBBF24', 700: '#B45309' },
  blue: { 400: '#60A5FA', 600: '#2563EB', 700: '#1D4ED8' },
} as const;

/**
 * Role-token color keys. Both themes MUST define every key so a theme is swappable wholesale.
 * `onPrimary` is the label color that sits on a `primary` fill — the documented dark-mode trap
 * (white on #4ADE80 fails WCAG AA), so it is a first-class token rather than a per-component guess.
 */
export type ColorTokens = {
  background: string;
  surface1: string;
  surface2: string;
  surface3: string;
  borderDefault: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryStrong: string;
  primarySubtle: string;
  primaryTint: string;
  onPrimary: string;
  error: string;
  warning: string;
  info: string;
};

export const lightColors: ColorTokens = {
  background: '#F7F8F7',
  surface1: '#FFFFFF',
  surface2: '#F0F2EF',
  // Light has no distinct surface-3 in §2 — modals are white (surface-1) lifted by elevation-3's
  // shadow, not a darker surface. Mirror surface-1 so the key exists in both themes.
  surface3: '#FFFFFF',
  borderDefault: '#E4E7E3',
  borderStrong: '#C3C9C0',
  textPrimary: '#293034',
  textSecondary: '#4B534D',
  textMuted: '#6B746E',
  primary: '#15803D',
  primaryStrong: '#166534',
  primarySubtle: '#16A34A',
  primaryTint: '#EAF9EF',
  // White on #15803D = 5.02:1, passes AA (§2 contrast table).
  onPrimary: '#FFFFFF',
  error: '#DC2626',
  warning: '#B45309',
  info: '#2563EB',
};

export const darkColors: ColorTokens = {
  background: '#0F1211',
  surface1: '#171A18',
  surface2: '#1F2321',
  surface3: '#262B27',
  borderDefault: '#333933',
  borderStrong: '#4B534D',
  textPrimary: '#EDEFEC',
  textSecondary: '#C4C9C2',
  textMuted: '#9AA69F',
  primary: '#4ADE80',
  primaryStrong: '#6FD494',
  primarySubtle: '#4ADE80',
  primaryTint: '#153322',
  // THE TRAP: white on #4ADE80 fails AA. Dark CTAs use bg/base (near-black) as the label — 10.81:1.
  onPrimary: '#0F1211',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
};

export const fontFamily = {
  sans: "'Geist', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
} as const;

export type TypographyToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  fontFamily: string;
  letterSpacing?: string;
  /** metric-* tokens cap OS text scaling at 130% to protect the set grid (§3). */
  maxScale?: number;
};

export const typography = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: 700, fontFamily: fontFamily.sans },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: 700, fontFamily: fontFamily.sans },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: 600, fontFamily: fontFamily.sans },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: 600, fontFamily: fontFamily.sans },
  body: { fontSize: 16, lineHeight: 24, fontWeight: 400, fontFamily: fontFamily.sans },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: 600, fontFamily: fontFamily.sans },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: 400, fontFamily: fontFamily.sans },
  label: { fontSize: 13, lineHeight: 16, fontWeight: 600, fontFamily: fontFamily.sans, letterSpacing: '0.02em' },
  metricLg: { fontSize: 48, lineHeight: 52, fontWeight: 600, fontFamily: fontFamily.mono, maxScale: 1.3 },
  metricMd: { fontSize: 28, lineHeight: 32, fontWeight: 600, fontFamily: fontFamily.mono, maxScale: 1.3 },
  metricSm: { fontSize: 16, lineHeight: 20, fontWeight: 500, fontFamily: fontFamily.mono, maxScale: 1.3 },
} as const satisfies Record<string, TypographyToken>;

export type TypographyVariant = keyof typeof typography;

/** 4px base unit, shared numeral scale — maps 1:1 to Tailwind's default spacing scale (§4). */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type ElevationStyle = {
  boxShadow: string;
  /** Dark mode conveys elevation via surface color + border, not shadow (§4). */
  backgroundColor?: string;
  border?: string;
};

/** Light mode uses real shadow; dark mode steps the surface color and adds a border (§4). */
export const lightElevation = {
  0: { boxShadow: 'none' },
  1: { boxShadow: '0 1px 2px rgba(20,24,20,0.06)' },
  2: { boxShadow: '0 4px 12px rgba(20,24,20,0.08)' },
  3: { boxShadow: '0 12px 32px rgba(20,24,20,0.12)' },
} as const satisfies Record<number, ElevationStyle>;

export const darkElevation = {
  0: { boxShadow: 'none', backgroundColor: darkColors.background },
  1: { boxShadow: 'none', backgroundColor: darkColors.surface1, border: `1px solid ${darkColors.borderDefault}` },
  2: { boxShadow: 'none', backgroundColor: darkColors.surface2, border: `1px solid ${darkColors.borderDefault}` },
  3: { boxShadow: 'none', backgroundColor: darkColors.surface3, border: `1px solid ${darkColors.borderStrong}` },
} as const satisfies Record<number, ElevationStyle>;

export const motion = {
  instant: '100ms',
  fast: '160ms',
  base: '220ms',
  slow: '320ms',
  easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  easeEntrance: 'cubic-bezier(0, 0, 0.2, 1)',
  easeExit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

export type Theme = {
  name: 'light' | 'dark';
  colors: ColorTokens;
  elevation: Record<0 | 1 | 2 | 3, ElevationStyle>;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  motion: typeof motion;
  fontFamily: typeof fontFamily;
};

export const lightTheme: Theme = {
  name: 'light',
  colors: lightColors,
  elevation: lightElevation,
  typography,
  spacing,
  radii,
  motion,
  fontFamily,
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: darkColors,
  elevation: darkElevation,
  typography,
  spacing,
  radii,
  motion,
  fontFamily,
};

export const themes = { light: lightTheme, dark: darkTheme } as const;
