/**
 * Gainly Design Tokens — Dark-First Premium Fitness App
 * Inspired by modern fitness apps: dark backgrounds, neon accents, bold stats.
 * §51: dark neutral surfaces, electric lime accent, oversized numbers, generous spacing.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0A0D0B',
    background: '#F5F6F4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EBF5EE',
    backgroundElevated: '#FFFFFF',
    textSecondary: '#5A635D',
    textMuted: '#8A918D',
    primary: '#15803D',
    primarySubtle: '#16A34A',
    primaryMuted: '#DCFCE7',
    onPrimary: '#FFFFFF',
    accent: '#4ADE80',
    border: '#E5E7E4',
    borderStrong: '#D1D5CE',
    card: '#FFFFFF',
    cardElevated: '#F8FAF9',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    // Near-black base — not pure black, reduces eye strain
    text: '#F0F2EF',
    background: '#0B0D0C',
    backgroundElement: '#141615',
    backgroundSelected: '#1A2E22',
    backgroundElevated: '#1C1E1D',
    textSecondary: '#9CA8A0',
    textMuted: '#5A635D',

    // Electric lime — the hero accent
    primary: '#C8FF00',
    primarySubtle: '#D4FF33',
    primaryMuted: '#1A2E10',
    onPrimary: '#0A0D0B',

    accent: '#C8FF00',
    accentCyan: '#00F0FF',
    accentCoral: '#FF6B6B',

    // Neon gradient helpers
    gradientStart: '#C8FF00',
    gradientEnd: '#00F0FF',

    border: '#1E2120',
    borderStrong: '#2A2D2B',
    card: '#141615',
    cardElevated: '#1C1E1D',
    success: '#C8FF00',
    warning: '#FFB800',
    error: '#FF4757',
    info: '#00F0FF',
    overlay: 'rgba(0,0,0,0.7)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
  ten: 40,
  twelve: 48,
  sixteen: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const Shadow = Platform.select({
  ios: {
    small: {
      shadowColor: '#C8FF00',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    medium: {
      shadowColor: '#C8FF00',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    large: {
      shadowColor: '#C8FF00',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 32,
    },
  },
  android: {
    small: { elevation: 4 },
    medium: { elevation: 8 },
    large: { elevation: 16 },
  },
  default: {
    small: { boxShadow: '0 2px 8px rgba(200,255,0,0.15)' },
    medium: { boxShadow: '0 4px 16px rgba(200,255,0,0.2)' },
    large: { boxShadow: '0 8px 32px rgba(200,255,0,0.25)' },
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
