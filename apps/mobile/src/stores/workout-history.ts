/**
 * Workout history store — completed workouts and progress data.
 * §56-§57: workout summary, weekly summary. §18-§19: progress sections.
 *
 * In production, this data lives in the DB (workout_sessions + workout_sets).
 * This provides the client-side interface for demo/offline mode.
 */

import { create } from 'zustand';

import { generateUUID } from '@/utils/uuid';
import { calculateE1RM } from '@gainly/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompletedWorkoutSet {
  exerciseId: string;
  exerciseName: string;
  weight: number | null;
  reps: number | null;
  setNumber: number;
  isCompleted: boolean;
}

export interface CompletedWorkout {
  id: string;
  name: string | null;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: CompletedWorkoutSet[];
  }[];
  totalVolume: number;
  totalSets: number;
  completedSets: number;
  totalReps: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  prType: 'max_weight' | 'max_e1rm' | 'max_reps' | 'max_volume';
  value: number;
  weight: number | null;
  reps: number | null;
  achievedAt: string;
  workoutId: string;
}

export interface WeeklyStats {
  weekStart: string;
  workoutsCompleted: number;
  totalDuration: number;
  totalVolume: number;
  totalSets: number;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface WorkoutHistoryState {
  workouts: CompletedWorkout[];
  personalRecords: PersonalRecord[];
}

export interface WorkoutHistoryActions {
  /** Record a completed workout. */
  recordWorkout: (workout: Omit<CompletedWorkout, 'id'>) => void;

  /** Get workout history sorted by date (newest first). */
  getHistory: () => CompletedWorkout[];

  /** Get workouts for a specific exercise. */
  getExerciseHistory: (exerciseId: string) => CompletedWorkout[];

  /** Get the previous performance for an exercise (last workout's sets). */
  getPreviousPerformance: (exerciseId: string) => CompletedWorkoutSet[] | null;

  /** Get personal records for all exercises. */
  getPersonalRecords: () => PersonalRecord[];

  /** Get personal records for a specific exercise. */
  getExercisePRs: (exerciseId: string) => PersonalRecord[];

  /** Get weekly stats for the last N weeks. */
  getWeeklyStats: (weeks?: number) => WeeklyStats[];

  /** Get total workout count. */
  getWorkoutCount: () => number;

  /** Get current streak (consecutive weeks with at least 1 workout). */
  getStreak: () => number;
}

export type WorkoutHistoryStore = WorkoutHistoryState & WorkoutHistoryActions;

export const useWorkoutHistory = create<WorkoutHistoryStore>((set, get) => ({
  workouts: [],
  personalRecords: [],

  recordWorkout: (workout) => {
    const id = generateUUID();
    const completed: CompletedWorkout = { ...workout, id };

    // Detect PRs
    const newPRs = detectPRs(completed, get().personalRecords);

    set((s) => ({
      workouts: [completed, ...s.workouts],
      personalRecords: [...s.personalRecords, ...newPRs],
    }));
  },

  getHistory: () => {
    return [...get().workouts].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  },

  getExerciseHistory: (exerciseId) => {
    return get()
      .workouts.filter((w) => w.exercises.some((e) => e.exerciseId === exerciseId))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  getPreviousPerformance: (exerciseId) => {
    const history = get().getExerciseHistory(exerciseId);
    return history[0]?.exercises.find((e) => e.exerciseId === exerciseId)?.sets ?? null;
  },

  getPersonalRecords: () => {
    return [...get().personalRecords].sort(
      (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime(),
    );
  },

  getExercisePRs: (exerciseId) => {
    return get().personalRecords.filter((pr) => pr.exerciseId === exerciseId);
  },

  getWeeklyStats: (weeks = 12) => {
    const now = new Date();
    const stats: WeeklyStats[] = [];

    for (let i = 0; i < weeks; i++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      const weekWorkouts = get().workouts.filter((w) => {
        const date = new Date(w.startedAt);
        return date >= weekStart && date < weekEnd;
      });

      stats.push({
        weekStart: weekStart.toISOString(),
        workoutsCompleted: weekWorkouts.length,
        totalDuration: weekWorkouts.reduce((s, w) => s + w.durationSeconds, 0),
        totalVolume: weekWorkouts.reduce((s, w) => s + w.totalVolume, 0),
        totalSets: weekWorkouts.reduce((s, w) => s + w.completedSets, 0),
      });
    }

    return stats.reverse(); // oldest first
  },

  getWorkoutCount: () => get().workouts.length,

  getStreak: () => {
    const workouts = get().workouts;
    if (workouts.length === 0) return 0;

    const now = new Date();
    let streak = 0;
    let checkDate = new Date(now);

    // Check current week first
    const weekStart = new Date(checkDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const hasWorkoutThisWeek = workouts.some((w) => {
      const date = new Date(w.startedAt);
      return date >= weekStart;
    });

    if (!hasWorkoutThisWeek) {
      // Check if they worked out last week (might be mid-week)
      checkDate.setDate(checkDate.getDate() - 7);
    }

    // Count consecutive weeks with workouts
    for (let i = 0; i < 52; i++) {
      const weekEnd = new Date(checkDate);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const wStart = new Date(weekEnd);
      wStart.setDate(wStart.getDate() - 7);

      const hasWorkout = workouts.some((w) => {
        const date = new Date(w.startedAt);
        return date >= wStart && date < weekEnd;
      });

      if (hasWorkout) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },
}));

// ---------------------------------------------------------------------------
// PR Detection
// ---------------------------------------------------------------------------

function detectPRs(
  workout: CompletedWorkout,
  existingPRs: PersonalRecord[],
): PersonalRecord[] {
  const newPRs: PersonalRecord[] = [];

  for (const exercise of workout.exercises) {
    const completedSets = exercise.sets.filter((s) => s.isCompleted);
    if (completedSets.length === 0) continue;

    // Max weight
    const maxWeightSet = completedSets.reduce((best, s) =>
      (s.weight ?? 0) > (best.weight ?? 0) ? s : best,
    );
    if (maxWeightSet.weight != null) {
      const currentBest = existingPRs.find(
        (pr) => pr.exerciseId === exercise.exerciseId && pr.prType === 'max_weight',
      );
      if (!currentBest || maxWeightSet.weight > currentBest.value) {
        newPRs.push({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          prType: 'max_weight',
          value: maxWeightSet.weight,
          weight: maxWeightSet.weight,
          reps: maxWeightSet.reps,
          achievedAt: workout.endedAt,
          workoutId: workout.id,
        });
      }
    }

    // Max e1RM
    for (const set of completedSets) {
      if (set.weight != null && set.reps != null && set.reps > 0) {
        const e1rm = calculateE1RM(set.weight, set.reps);
        const currentBest = existingPRs.find(
          (pr) => pr.exerciseId === exercise.exerciseId && pr.prType === 'max_e1rm',
        );
        if (!currentBest || e1rm > currentBest.value) {
          newPRs.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            prType: 'max_e1rm',
            value: e1rm,
            weight: set.weight,
            reps: set.reps,
            achievedAt: workout.endedAt,
            workoutId: workout.id,
          });
          break; // Only one e1rm PR per exercise per workout
        }
      }
    }

    // Max volume (single set)
    for (const set of completedSets) {
      if (set.weight != null && set.reps != null) {
        const volume = set.weight * set.reps;
        const currentBest = existingPRs.find(
          (pr) => pr.exerciseId === exercise.exerciseId && pr.prType === 'max_volume',
        );
        if (!currentBest || volume > currentBest.value) {
          newPRs.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            prType: 'max_volume',
            value: volume,
            weight: set.weight,
            reps: set.reps,
            achievedAt: workout.endedAt,
            workoutId: workout.id,
          });
          break;
        }
      }
    }
  }

  return newPRs;
}
