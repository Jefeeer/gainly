/**
 * Exercise aliases — Gainly-owned data for search enhancement.
 * Exercise-mapping.md §5: "The package has no alias data. exercise_aliases is fully Gainly-owned."
 *
 * This module provides a client-side alias lookup that can be used alongside the WG provider.
 * In production, aliases will come from the DB (exercise_aliases table); this provides
 * the initial seed and the in-memory lookup for offline use.
 */

import { normalizeSearchText } from './mapper';

export interface ExerciseAlias {
  exerciseSlug: string;
  alias: string;
  normalizedAlias: string;
}

/**
 * Seed aliases — common exercise name variations.
 * In production these come from the DB; this provides the initial set.
 */
const SEED_ALIASES: ExerciseAlias[] = [
  { exerciseSlug: 'bench-press', alias: 'Flat Bench', normalizedAlias: normalizeSearchText('Flat Bench') },
  { exerciseSlug: 'bench-press', alias: 'Barbell Bench Press', normalizedAlias: normalizeSearchText('Barbell Bench Press') },
  { exerciseSlug: 'incline-dumbbell-press', alias: 'Incline DB Press', normalizedAlias: normalizeSearchText('Incline DB Press') },
  { exerciseSlug: 'deadlift', alias: 'Conventional Deadlift', normalizedAlias: normalizeSearchText('Conventional Deadlift') },
  { exerciseSlug: 'romanian-deadlift', alias: 'RDL', normalizedAlias: normalizeSearchText('RDL') },
  { exerciseSlug: 'romanian-deadlift', alias: 'Barbell RDL', normalizedAlias: normalizeSearchText('Barbell RDL') },
  { exerciseSlug: 'romanian-deadlift', alias: 'Romanian Dead Lift', normalizedAlias: normalizeSearchText('Romanian Dead Lift') },
  { exerciseSlug: 'barbell-squat', alias: 'Back Squat', normalizedAlias: normalizeSearchText('Back Squat') },
  { exerciseSlug: 'pull-up', alias: 'Chin-up', normalizedAlias: normalizeSearchText('Chin-up') },
  { exerciseSlug: 'pull-up', alias: 'Pullup', normalizedAlias: normalizeSearchText('Pullup') },
  { exerciseSlug: 'overhead-press', alias: 'OHP', normalizedAlias: normalizeSearchText('OHP') },
  { exerciseSlug: 'overhead-press', alias: 'Military Press', normalizedAlias: normalizeSearchText('Military Press') },
  { exerciseSlug: 'overhead-press', alias: 'Shoulder Press', normalizedAlias: normalizeSearchText('Shoulder Press') },
  { exerciseSlug: 'barbell-row', alias: 'Bent Over Row', normalizedAlias: normalizeSearchText('Bent Over Row') },
  { exerciseSlug: 'barbell-row', alias: 'Bent-Over Row', normalizedAlias: normalizeSearchText('Bent-Over Row') },
  { exerciseSlug: 'dumbbell-curl', alias: 'DB Curl', normalizedAlias: normalizeSearchText('DB Curl') },
  { exerciseSlug: 'tricep-pushdown', alias: 'Cable Pushdown', normalizedAlias: normalizeSearchText('Cable Pushdown') },
  { exerciseSlug: 'lateral-raise', alias: 'Side Lateral Raise', normalizedAlias: normalizeSearchText('Side Lateral Raise') },
  { exerciseSlug: 'hip-thrust', alias: 'Barbell Hip Thrust', normalizedAlias: normalizeSearchText('Barbell Hip Thrust') },
  { exerciseSlug: 'leg-press', alias: 'Machine Squat', normalizedAlias: normalizeSearchText('Machine Squat') },
];

/**
 * Alias lookup — maps normalized alias → exercise slug.
 * Built from seed aliases + any DB-loaded aliases.
 */
export class AliasLookup {
  private byNormalized = new Map<string, string>();
  private bySlug = new Map<string, string[]>();

  constructor(seedAliases: ExerciseAlias[] = SEED_ALIASES) {
    for (const alias of seedAliases) {
      this.add(alias);
    }
  }

  /** Add an alias to the lookup. */
  add(alias: ExerciseAlias): void {
    this.byNormalized.set(alias.normalizedAlias, alias.exerciseSlug);
    const existing = this.bySlug.get(alias.exerciseSlug) ?? [];
    existing.push(alias.alias);
    this.bySlug.set(alias.exerciseSlug, existing);
  }

  /** Resolve a search term to an exercise slug via alias match. */
  resolve(searchTerm: string): string | null {
    const normalized = normalizeSearchText(searchTerm);
    return this.byNormalized.get(normalized) ?? null;
  }

  /** Get all aliases for an exercise slug. */
  getAliases(exerciseSlug: string): string[] {
    return this.bySlug.get(exerciseSlug) ?? [];
  }

  /** Check if a search term matches any alias. */
  hasMatch(searchTerm: string): boolean {
    return this.resolve(searchTerm) !== null;
  }

  /** Get all registered slugs. */
  getAllSlugs(): string[] {
    return [...this.bySlug.keys()];
  }
}

/** Default alias lookup instance with seed aliases. */
export const defaultAliasLookup = new AliasLookup();
