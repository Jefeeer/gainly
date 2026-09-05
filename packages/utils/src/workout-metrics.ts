// Workout finish aggregation — computes cached metrics for workout_sessions.
// Semantics: docs/workout-semantics.md, GAINLY_MASTER_BUILD_PROMPT.md §17.
// All functions are pure, synchronous, and testable without a database.

/** A set as it exists in the DB — only the fields needed for aggregation. */
export interface SetForMetrics {
  weight: number | null;
  reps: number | null;
  duration_seconds: number | null;
  distance: number | null;
  is_completed: boolean;
  set_type: string; // warmup | normal | drop | failure | superset
}

/** An exercise with its sets — the unit of iteration for aggregation. */
export interface ExerciseForMetrics {
  sets: SetForMetrics[];
}

/** Aggregated workout metrics — written to workout_sessions on finish. */
export interface WorkoutMetrics {
  duration_seconds: number | null;
  total_sets: number;
  completed_sets: number;
  total_reps: number;
  total_volume: number;
}

/**
 * Compute workout duration from start/end timestamps.
 * Returns null if either timestamp is missing.
 */
export function computeDuration(
  startedAt: string | Date,
  endedAt: string | Date | null,
): number | null {
  if (!endedAt) return null;
  const start = typeof startedAt === 'string' ? new Date(startedAt).getTime() : startedAt.getTime();
  const end = typeof endedAt === 'string' ? new Date(endedAt).getTime() : endedAt.getTime();
  return Math.max(0, Math.round((end - start) / 1000));
}

/**
 * Aggregate metrics across all exercises in a workout session.
 *
 * Volume = weight × reps (§17). Only sets with both weight and reps contribute to volume.
 * Duration and distance sets contribute their own fields but not to volume in v1.
 * Warm-up sets ARE counted in total_sets/completed_sets but their volume still counts
 * (the user did lift that weight). This matches §17's definition.
 */
export function aggregateWorkoutMetrics(exercises: ExerciseForMetrics[]): WorkoutMetrics {
  let totalSets = 0;
  let completedSets = 0;
  let totalReps = 0;
  let totalVolume = 0;

  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      totalSets += 1;
      if (set.is_completed) {
        completedSets += 1;
      }
      if (set.reps != null) {
        totalReps += set.reps;
      }
      if (set.weight != null && set.reps != null) {
        totalVolume += set.weight * set.reps;
      }
    }
  }

  return {
    duration_seconds: null, // caller supplies via computeDuration
    total_sets: totalSets,
    completed_sets: completedSets,
    total_reps: totalReps,
    total_volume: totalVolume,
  };
}

/**
 * Build complete workout metrics including duration.
 * Call this on workout finish with the session timestamps and exercises.
 */
export function buildWorkoutMetrics(
  startedAt: string | Date,
  endedAt: string | Date | null,
  exercises: ExerciseForMetrics[],
): WorkoutMetrics {
  return {
    ...aggregateWorkoutMetrics(exercises),
    duration_seconds: computeDuration(startedAt, endedAt),
  };
}
