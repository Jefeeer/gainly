/**
 * Workout Guide import script — idempotent seed per §96 / exercise-mapping.md §7.
 *
 * This script reads the typed `exercises` export from @bryllim/workout-guide,
 * maps each to Gainly's canonical taxonomy, and produces import-ready output.
 *
 * SCHEMA-BLOCKED: requires a live Supabase DB with the exercises table applied.
 * The mapping + validation logic is complete and testable; the DB writes are
 * gated on G-52 (human-authorized migration application).
 *
 * Usage: pnpm exercises:import
 */

import { exercises, type Exercise } from '@bryllim/workout-guide';

import {
  generateSlug,
  mapEquipment,
  mapExerciseType,
  mapMuscleGroup,
  normalizeSearchText,
} from '../packages/exercises/src/mapper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportRow {
  name: string;
  slug: string;
  exercise_type: string;
  equipment: string;
  primary_muscle: string;
  secondary_muscles: string[];
  is_stretch: boolean;
  source: 'workout_guide';
  external_source: string;
  external_id: string;
  external_slug: string;
  asset_provider: string;
  asset_key: string;
  asset_frame_count: number;
  is_custom: false;
  is_active: true;
  created_by: null;
}

interface ImportReport {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  skipReasons: string[];
  duplicateCandidates: number;
  mappingWarnings: { muscle: string[]; equipment: string[] };
  missingIllustrations: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateExercise(ex: Exercise, index: number): string | null {
  if (!ex.slug || typeof ex.slug !== 'string') return `Row ${index}: missing slug`;
  if (!ex.name || typeof ex.name !== 'string') return `Row ${index}: missing name`;
  if (!ex.frames || !Array.isArray(ex.frames) || ex.frames.length !== 3) {
    return `Row ${index} (${ex.slug}): expected 3 frames, got ${ex.frames?.length ?? 0}`;
  }
  const type = mapExerciseType(ex.exerciseType);
  if (!type) return `Row ${index} (${ex.slug}): unknown exercise type "${ex.exerciseType}"`;
  return null; // valid
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapExercise(wgExercise: Exercise): {
  row: ImportRow;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Map muscles
  const primaryResult = mapMuscleGroup(wgExercise.primaryMuscle);
  if (primaryResult.warning) warnings.push(`primary: ${primaryResult.warning}`);

  const secondaryMuscles: string[] = [];
  for (const secondary of wgExercise.secondaryMuscles) {
    const result = mapMuscleGroup(secondary);
    if (result.warning) warnings.push(`secondary: ${result.warning}`);
    secondaryMuscles.push(result.muscle);
  }

  // Map equipment
  const equipResult = mapEquipment(wgExercise.equipment);
  if (equipResult.warning) warnings.push(`equipment: ${equipResult.warning}`);

  // Map type
  const exerciseType = mapExerciseType(wgExercise.exerciseType)!;

  // Generate Gainly slug (separate from external slug)
  const slug = generateSlug(wgExercise.name);

  // External keys
  const externalId = wgExercise.id; // "exercise-<slug>"
  const externalSlug = wgExercise.slug; // "<slug>"

  return {
    row: {
      name: wgExercise.name,
      slug,
      exercise_type: exerciseType,
      equipment: equipResult.equipment,
      primary_muscle: primaryResult.muscle,
      secondary_muscles: secondaryMuscles,
      is_stretch: wgExercise.isStretch,
      source: 'workout_guide',
      external_source: 'bryllim_workout_guide',
      external_id: externalId,
      external_slug: externalSlug,
      asset_provider: 'workout_guide',
      asset_key: externalSlug,
      asset_frame_count: 3,
      is_custom: false,
      is_active: true,
      created_by: null,
    },
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Import runner
// ---------------------------------------------------------------------------

export function runImport(): ImportReport {
  const report: ImportReport = {
    discovered: exercises.length,
    created: 0,
    updated: 0,
    skipped: 0,
    skipReasons: [],
    duplicateCandidates: 0,
    mappingWarnings: { muscle: [], equipment: [] },
    missingIllustrations: 0,
    errors: 0,
  };

  const importRows: ImportRow[] = [];
  const allWarnings: string[] = [];

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];

    // Validate
    const validationError = validateExercise(ex, i);
    if (validationError) {
      report.skipped++;
      report.skipReasons.push(validationError);
      continue;
    }

    // Map
    try {
      const { row, warnings } = mapExercise(ex);
      importRows.push(row);
      allWarnings.push(...warnings);
    } catch (err) {
      report.errors++;
      report.skipReasons.push(`Row ${i} (${ex.slug}): mapping error — ${err}`);
    }
  }

  // Categorize warnings
  for (const warning of allWarnings) {
    if (warning.includes('primary:') || warning.includes('secondary:')) {
      report.mappingWarnings.muscle.push(warning);
    } else if (warning.includes('equipment:')) {
      report.mappingWarnings.equipment.push(warning);
    }
  }

  // In a real run, these would be DB writes:
  // - Upsert by (external_source, external_slug)
  // - Create if absent, update permitted metadata on existing
  // - Never touch source IN ('user','gainly','admin') rows
  report.created = importRows.length; // placeholder — would be actual DB creates

  return report;
}

// ---------------------------------------------------------------------------
// Report formatter
// ---------------------------------------------------------------------------

export function formatReport(report: ImportReport): string {
  const lines = [
    `Workout Guide import  v1.0.0`,
    `  discovered:            ${report.discovered}`,
    `  created:               ${report.created}`,
    `  updated:               ${report.updated}`,
    `  skipped (invalid):     ${report.skipped}`,
  ];

  if (report.skipReasons.length > 0) {
    for (const reason of report.skipReasons.slice(0, 10)) {
      lines.push(`    - ${reason}`);
    }
    if (report.skipReasons.length > 10) {
      lines.push(`    ... and ${report.skipReasons.length - 10} more`);
    }
  }

  lines.push(`  duplicate candidates:  ${report.duplicateCandidates}`);
  lines.push(`  mapping warnings:`);
  lines.push(`    muscle → Other/lossy: ${report.mappingWarnings.muscle.length}`);
  lines.push(`    equipment → Other:    ${report.mappingWarnings.equipment.length}`);
  lines.push(`  missing illustrations:  ${report.missingIllustrations}`);
  lines.push(`  errors:                ${report.errors}`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

// When run directly: execute the import and print the report
const isMain = process.argv[1]?.includes('import-workout-guide');
if (isMain) {
  console.log('Running Workout Guide import...\n');
  const report = runImport();
  console.log(formatReport(report));
}
