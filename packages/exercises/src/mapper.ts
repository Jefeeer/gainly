/**
 * Exercise mapping layer — normalizes Workout Guide taxonomy into Gainly canonical values.
 * Source of truth: docs/exercise-mapping.md §2-§4.
 *
 * These are pure functions, version-controlled with the importer. The DB stores only
 * the already-normalized canonical values. Unknown values map to 'Other' + emit a warning.
 */

// ---------------------------------------------------------------------------
// Muscle mapping — WG → Gainly canonical (exercise-mapping.md §3)
// ---------------------------------------------------------------------------

/** Gainly canonical muscle groups (§13 L593-610). */
export type GainlyMuscle =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Quadriceps'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Abdominals'
  | 'Lower Back'
  | 'Traps'
  | 'Full Body'
  | 'Cardio'
  | 'Other';

const MUSCLE_MAP: Record<string, GainlyMuscle> = {
  // Direct 1:1 mappings
  Chest: 'Chest',
  Back: 'Back',
  Shoulders: 'Shoulders',
  Biceps: 'Biceps',
  Triceps: 'Triceps',
  Forearms: 'Forearms',
  Hamstrings: 'Hamstrings',
  Glutes: 'Glutes',
  Calves: 'Calves',
  'Lower Back': 'Lower Back',
  Cardio: 'Cardio',

  // Renames
  Quads: 'Quadriceps',
  Core: 'Abdominals',

  // Lossy folds (exercise-mapping.md §3 ⚠ rows)
  Lats: 'Back', // ⚠ lossy — Gainly has no Lats
  'Upper Back': 'Back', // ⚠ could be Traps; default Back
  'Rear Delts': 'Shoulders', // ⚠ lossy — folds into Shoulders
  Legs: 'Full Body', // ⚠ ambiguous umbrella (D-M1)
  'Posterior Chain': 'Full Body', // ⚠ no Gainly equiv (D-M2)
  Mobility: 'Other', // ⚠ no equiv; pairs with isStretch
  Adductors: 'Other', // ⚠ no equiv (D-M3)
  Hips: 'Glutes', // ⚠ lossy — nearest is Glutes
  Grip: 'Forearms', // secondary-only
  Groin: 'Other', // ⚠ = Adductors → Other
};

/** Muscles that produce import warnings (lossy or Other mapping). */
export const LOSSY_MUSCLES = new Set([
  'Lats',
  'Upper Back',
  'Rear Delts',
  'Legs',
  'Posterior Chain',
  'Mobility',
  'Adductors',
  'Hips',
  'Groin',
]);

/**
 * Map a Workout Guide muscle string to a Gainly canonical muscle group.
 * Returns { muscle, warning } — warning is non-null for lossy/Other mappings.
 */
export function mapMuscleGroup(wgMuscle: string): { muscle: GainlyMuscle; warning: string | null } {
  const muscle = MUSCLE_MAP[wgMuscle];
  if (!muscle) {
    return { muscle: 'Other', warning: `Unknown muscle group: "${wgMuscle}"` };
  }
  if (LOSSY_MUSCLES.has(wgMuscle)) {
    return { muscle, warning: `Lossy mapping: "${wgMuscle}" → "${muscle}"` };
  }
  return { muscle, warning: null };
}

// ---------------------------------------------------------------------------
// Equipment mapping — WG → Gainly canonical (exercise-mapping.md §4)
// ---------------------------------------------------------------------------

/** Gainly canonical equipment types (§13 L612-625). */
export type GainlyEquipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Smith Machine'
  | 'Kettlebell'
  | 'Resistance Band'
  | 'EZ Bar'
  | 'Trap Bar'
  | 'Cardio Machine'
  | 'Other';

const EQUIPMENT_MAP: Record<string, GainlyEquipment> = {
  // Direct 1:1
  Bodyweight: 'Bodyweight',
  Dumbbell: 'Dumbbell',
  Machine: 'Machine',
  Barbell: 'Barbell',
  Cable: 'Cable',
  'Resistance Band': 'Resistance Band',
  Kettlebell: 'Kettlebell',

  // Renames
  Cardio: 'Cardio Machine', // ⚠ some "Cardio" is bodyweight
};

/** Equipment that produces import warnings (Other mapping). */
export const LOSSY_EQUIPMENT = new Set([
  'Pull-up Bar',
  'Wall',
  'Towel',
  'Plate',
  'Doorway',
  'Box',
  'Bench',
  'Chair',
  'Stability Ball',
]);

/**
 * Map a Workout Guide equipment string to a Gainly canonical equipment type.
 * Returns { equipment, warning } — warning is non-null for Other mappings.
 */
export function mapEquipment(wgEquipment: string): { equipment: GainlyEquipment; warning: string | null } {
  const equipment = EQUIPMENT_MAP[wgEquipment];
  if (equipment) {
    // Special case: "Cardio" that is actually bodyweight
    if (wgEquipment === 'Cardio') {
      return { equipment, warning: 'Mapping "Cardio" to "Cardio Machine" (verify per exercise)' };
    }
    return { equipment, warning: null };
  }
  if (LOSSY_EQUIPMENT.has(wgEquipment)) {
    return { equipment: 'Other', warning: `Unsupported equipment: "${wgEquipment}" → Other` };
  }
  return { equipment: 'Other', warning: `Unknown equipment: "${wgEquipment}"` };
}

// ---------------------------------------------------------------------------
// Exercise type mapping — WG → Gainly (exercise-mapping.md §2)
// WG types adopted 1:1, no lossy mapping needed.
// ---------------------------------------------------------------------------

/** Gainly tracking types matching WG 1:1. */
export type GainlyExerciseType =
  | 'weight_reps'
  | 'bodyweight_reps'
  | 'duration'
  | 'distance_duration'
  | 'assisted_bodyweight';

const TYPE_MAP: Record<string, GainlyExerciseType> = {
  weight_reps: 'weight_reps',
  bodyweight_reps: 'bodyweight_reps',
  duration: 'duration',
  distance_duration: 'distance_duration',
  assisted_bodyweight: 'assisted_bodyweight',
};

/**
 * Map a Workout Guide exercise type to a Gainly tracking type.
 * Returns null if the type is unknown (should not happen with current WG data).
 */
export function mapExerciseType(wgType: string): GainlyExerciseType | null {
  return TYPE_MAP[wgType] ?? null;
}

// ---------------------------------------------------------------------------
// Search text normalization — reuse WG's verbatim algorithm (exercise-mapping.md §5)
// ---------------------------------------------------------------------------

/**
 * Normalize text for search/alias matching.
 * Identical to @bryllim/workout-guide's normalizeSearchText:
 * lowercase, strip diacritics, & → "and", non-alphanumeric → space, collapse whitespace.
 * This ensures Gainly-side alias matching is identical to package-side search normalization.
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// Slug generation — Gainly's own slugs from names
// ---------------------------------------------------------------------------

/**
 * Generate a Gainly slug from an exercise name.
 * Normalizes and hyphenates. Used for Gainly's own slug field (not the external slug).
 */
export function generateSlug(name: string): string {
  return normalizeSearchText(name).replace(/\s+/g, '-');
}
