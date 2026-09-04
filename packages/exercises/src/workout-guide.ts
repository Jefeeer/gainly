// @gainly/exercises — the ONE file that imports @bryllim/workout-guide directly (§13A L1216
// isolation mandate: delete this seam and Gainly's own DB-resident exercises still work). Everything
// else in Gainly depends on this provider, never on the package. This is the in-memory catalog
// provider (normalize / search / filter over the 302 WG exercises); the DB import/seed and the
// WG->Gainly taxonomy mapper are separate, schema-blocked work.
//
// LICENSE: this module touches METADATA only (names/muscles/equipment/slugs = MIT/facts). The 906
// images are CC BY-SA 4.0 — assetUrl only builds a URL to the verbatim frame; nothing here modifies
// image bytes, so ShareAlike is not triggered here. Tint at render time downstream, never pre-bake.
import {
  exercises as wgExercises,
  getAssetUrl as wgGetAssetUrl,
  getExercise as wgGetExercise,
  normalizeSearchText,
  searchExercises as wgSearchExercises,
} from '@bryllim/workout-guide';
import type {
  AssetUrlOptions,
  Exercise,
  ExerciseAttribution,
  ExerciseFrame,
  ExerciseSearchFilters,
  ExerciseType,
} from '@bryllim/workout-guide';

// Re-export the package types so Gainly code has a single import point for them too.
export type { AssetUrlOptions, Exercise, ExerciseAttribution, ExerciseFrame, ExerciseSearchFilters, ExerciseType };
export { normalizeSearchText };

/** Valid frame indices — a WG exercise always has exactly frames 1, 2, 3. */
export type FrameIndex = ExerciseFrame['index'];

/** Distinct filter values (sorted) the raw package does not expose — for filter/browse UIs. */
export interface ExerciseFacets {
  equipment: string[];
  primaryMuscles: string[];
  exerciseTypes: ExerciseType[];
  stretchCount: number;
  total: number;
}

/** Gainly-facing, mockable surface over the WG catalog. */
export interface ExerciseProvider {
  all(): readonly Exercise[];
  count(): number;
  get(idOrSlug: string): Exercise | null;
  search(query?: string, filters?: ExerciseSearchFilters): Exercise[];
  assetUrl(idOrSlug: string, frame: FrameIndex, options?: AssetUrlOptions): string | null;
  normalize(text: string): string;
  facets(): ExerciseFacets;
}

function computeFacets(catalog: readonly Exercise[]): ExerciseFacets {
  const equipment = new Set<string>();
  const primaryMuscles = new Set<string>();
  const exerciseTypes = new Set<ExerciseType>();
  let stretchCount = 0;
  for (const ex of catalog) {
    equipment.add(ex.equipment);
    primaryMuscles.add(ex.primaryMuscle);
    exerciseTypes.add(ex.exerciseType);
    if (ex.isStretch) stretchCount += 1;
  }
  return {
    equipment: [...equipment].sort(),
    primaryMuscles: [...primaryMuscles].sort(),
    exerciseTypes: [...exerciseTypes].sort(),
    stretchCount,
    total: catalog.length,
  };
}

let facetsCache: ExerciseFacets | undefined;

// get/search/assetUrl/normalize delegate to the package (its search tokenizer + null-safe resolution
// are already correct — do not reimplement). facets/count/all read the catalog directly.
export const workoutGuideProvider: ExerciseProvider = {
  all: () => wgExercises,
  count: () => wgExercises.length,
  get: (idOrSlug) => wgGetExercise(idOrSlug),
  search: (query, filters) => wgSearchExercises(query, filters),
  assetUrl: (idOrSlug, frame, options) => wgGetAssetUrl(idOrSlug, frame, options),
  normalize: (text) => normalizeSearchText(text),
  facets: () => (facetsCache ??= computeFacets(wgExercises)),
};
