/**
 * Gainly Design Tokens — Modern Premium Fitness App
 * §51: dark neutral surfaces, green accent, strong typography, generous spacing.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1D1B',
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
    text: '#F0F2EF',
    background: '#0A0D0B',
    backgroundElement: '#141816',
    backgroundSelected: '#1A2E22',
    backgroundElevated: '#1C201E',
    textSecondary: '#9CA8A0',
    textMuted: '#6B7A70',
    primary: '#4ADE80',
    primarySubtle: '#6EE7A0',
    primaryMuted: '#143322',
    onPrimary: '#0A0D0B',
    accent: '#4ADE80',
    border: '#242B27',
    borderStrong: '#374038',
    card: '#141816',
    cardElevated: '#1C201E',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    overlay: 'rgba(0,0,0,0.6)',
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
  },
  android: {
    small: { elevation: 2 },
    medium: { elevation: 4 },
    large: { elevation: 8 },
  },
  default: {
    small: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    medium: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    large: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
