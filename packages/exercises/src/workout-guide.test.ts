// P1-WGADAPT (Dwight): in-memory ExerciseProvider over @bryllim/workout-guide's 302-exercise catalog.
// Tests assert real package behavior (no mocks) — the provider is the single isolation seam, so if the
// package's shape drifts on upgrade these fail loudly. Grounded in docs/workout-guide-integration.md,
// re-verified against the installed package at build time.
import { describe, expect, it } from 'vitest';
import { workoutGuideProvider as p } from './workout-guide';

describe('workoutGuideProvider (P1-WGADAPT)', () => {
  it('exposes the full 302-exercise catalog', () => {
    expect(p.count()).toBe(302);
    expect(p.all()).toHaveLength(302);
  });

  it('resolves by slug AND by id, id-first, null on miss (never throws)', () => {
    const bySlug = p.get('bench-press');
    const byId = p.get('exercise-bench-press');
    expect(bySlug?.name).toBe('Bench Press');
    expect(byId?.id).toBe('exercise-bench-press');
    expect(bySlug).toEqual(byId);
    expect(p.get('no-such-exercise')).toBeNull();
  });

  it('every exercise has exactly 3 frames (a constant, not variable)', () => {
    expect(p.all().every((e) => e.frames.length === 3)).toBe(true);
  });

  it('search with an empty query returns the whole catalog', () => {
    expect(p.search()).toHaveLength(302);
  });

  it('search matches on the name/equipment/muscle haystack', () => {
    const hits = p.search('bench');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((e) => e.slug === 'bench-press')).toBe(true);
  });

  it('search filters scope the result (isStretch bucket = 14)', () => {
    expect(p.search(undefined, { isStretch: true })).toHaveLength(14);
  });

  it('normalize reuses the package normalizer (diacritics, punctuation, collapse)', () => {
    expect(p.normalize('  Púll-Up BAR ')).toBe('pull up bar');
  });

  it('assetUrl resolves a frame, honors a baseUrl override, and is null-safe', () => {
    expect(p.assetUrl('bench-press', 1)).toMatch(/assets\/bench-press\/frame-1\.png$/);
    expect(p.assetUrl('bench-press', 1, { baseUrl: 'https://cdn.example.com/wg' })).toBe(
      'https://cdn.example.com/wg/assets/bench-press/frame-1.png',
    );
    expect(p.assetUrl('no-such-exercise', 1)).toBeNull();
  });

  it('facets expose sorted, distinct filter values plus counts', () => {
    const f = p.facets();
    expect(f.total).toBe(302);
    expect(f.stretchCount).toBe(14);
    expect(f.equipment).toContain('Barbell');
    expect(f.primaryMuscles).toContain('Chest');
    expect(f.exerciseTypes).toContain('weight_reps');
    // distinct + sorted
    expect(f.equipment).toEqual([...new Set(f.equipment)]);
    expect([...f.equipment]).toEqual([...f.equipment].sort());
  });
});
