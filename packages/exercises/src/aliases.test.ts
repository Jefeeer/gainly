import { describe, expect, it } from 'vitest';

import { AliasLookup } from './aliases';

describe('AliasLookup', () => {
  const lookup = new AliasLookup();

  it('resolves exact alias matches', () => {
    expect(lookup.resolve('RDL')).toBe('romanian-deadlift');
    expect(lookup.resolve('OHP')).toBe('overhead-press');
    expect(lookup.resolve('Back Squat')).toBe('barbell-squat');
  });

  it('resolves case-insensitive matches', () => {
    expect(lookup.resolve('rdl')).toBe('romanian-deadlift');
    expect(lookup.resolve('ohp')).toBe('overhead-press');
  });

  it('returns null for unknown aliases', () => {
    expect(lookup.resolve('Nonexistent')).toBeNull();
  });

  it('getAliases returns all aliases for a slug', () => {
    const aliases = lookup.getAliases('romanian-deadlift');
    expect(aliases).toContain('RDL');
    expect(aliases).toContain('Barbell RDL');
    expect(aliases).toContain('Romanian Dead Lift');
  });

  it('getAliases returns empty array for unknown slug', () => {
    expect(lookup.getAliases('unknown-exercise')).toEqual([]);
  });

  it('hasMatch returns true for known aliases', () => {
    expect(lookup.hasMatch('RDL')).toBe(true);
    expect(lookup.hasMatch('OHP')).toBe(true);
  });

  it('hasMatch returns false for unknown aliases', () => {
    expect(lookup.hasMatch('Nonexistent')).toBe(false);
  });

  it('getAllSlugs returns unique slugs', () => {
    const slugs = lookup.getAllSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('can add custom aliases', () => {
    const custom = new AliasLookup();
    custom.add({
      exerciseSlug: 'my-custom-exercise',
      alias: 'Custom Alias',
      normalizedAlias: 'custom alias',
    });
    expect(custom.resolve('Custom Alias')).toBe('my-custom-exercise');
  });
});
