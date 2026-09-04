import { describe, expect, it } from 'vitest';

import { darkColors, darkTheme, lightColors, lightTheme, type ColorTokens } from './tokens';

describe('design tokens', () => {
  it('defines the same color role keys in both themes (swappable wholesale)', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });

  it('carries the exact design-system.md role values (no drift)', () => {
    // Spot-check the load-bearing ones against docs/design-system.md §2.
    expect(lightColors.background).toBe('#F7F8F7');
    expect(lightColors.textPrimary).toBe('#293034');
    expect(lightColors.primary).toBe('#15803D');
    expect(darkColors.background).toBe('#0F1211');
    expect(darkColors.textPrimary).toBe('#EDEFEC');
    expect(darkColors.primary).toBe('#4ADE80');
  });

  it('encodes the dark-mode button-label trap: onPrimary is bg/base, never white', () => {
    // The whole reason this token exists: white on #4ADE80 fails WCAG AA. If someone "fixes" this
    // to #FFFFFF, this test must fail.
    expect(darkColors.onPrimary).toBe('#0F1211');
    expect(darkColors.onPrimary).not.toBe('#FFFFFF');
    // Light-mode green is dark enough that a white label passes (5.02:1).
    expect(lightColors.onPrimary).toBe('#FFFFFF');
  });

  it('names each theme so a consumer can branch on it', () => {
    expect(lightTheme.name).toBe('light');
    expect(darkTheme.name).toBe('dark');
  });

  it('exposes elevation for levels 0-3 in both themes', () => {
    for (const theme of [lightTheme, darkTheme]) {
      for (const level of [0, 1, 2, 3] as const) {
        expect(theme.elevation[level]).toBeDefined();
      }
    }
    // Dark elevation steps the surface color; light uses a real shadow (§4).
    expect(darkTheme.elevation[1].backgroundColor).toBe('#171A18');
    expect(lightTheme.elevation[1].boxShadow).toContain('rgba');
  });
});

// Type-level guard: both maps must satisfy the same shape.
const _lightIsColorTokens: ColorTokens = lightColors;
const _darkIsColorTokens: ColorTokens = darkColors;
void _lightIsColorTokens;
void _darkIsColorTokens;
