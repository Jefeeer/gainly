/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

/**
 * Always returns dark theme for premium fitness app look.
 * The dark-first design is intentional — see design-system.md §51.
 */
export function useTheme() {
  return Colors.dark;
}
