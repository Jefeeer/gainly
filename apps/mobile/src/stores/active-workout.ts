/**
 * Active-workout Zustand store — Layer A of the offline architecture (offline.md §2).
 *
 * This is the source of truth while training. The UI reads/writes here with zero network
 * dependency — this is what makes set entry instant (§53, §82). Layer B (durable persistence)
 * and Layer C (sync queue) will wrap this store in a future offline integration step.
 *
 * Design principles:
 * - Optimistic: all mutations apply immediately to local state
 * - Idempotent: client-assigned set_number is stable across retries (workout-semantics.md §3)
 * - Client-generated UUIDs: each entity gets a stable id for offline replay keys
 */

import { create } from 'zustand';

import { generateUUID } from '@/utils/uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActiveSet {
  id: string;
  clientUuid: string;
  setNumber: number;
  setType: 'warmup' | 'normal' | 'drop' | 'failure' | 'superset';
  weight: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distance: number | null;
  rpe: number | null;
  isCompleted: boolean;
  completedAt: string | null;
  notes: string;
}

export interface ActiveExercise {
  id: string;
  clientUuid: string;
  exerciseId: string;
  exerciseName: string;
  position: number;
  sets: ActiveSet[];
  notes: string;
}

export type RestTimerState = {
  isRunning: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  exerciseId: string | null;
};

export interface ActiveWorkout {
  id: string;
  clientUuid: string;
  name: string | null;
  templateId: string | null;
  startedAt: string;
  exercises: ActiveExercise[];
  notes: string;
  restTimer: RestTimerState;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface WorkoutActions {
  /** Start a new empty workout. */
  startWorkout: (payload?: { name?: string; templateId?: string }) => void;

  /** Discard the active workout (clear everything). */
  discardWorkout: () => void;

  /** Add an exercise to the workout. */
  addExercise: (payload: {
    exerciseId: string;
    exerciseName: string;
    position?: number;
  }) => void;

  /** Remove an exercise from the workout. */
  removeExercise: (exerciseClientId: string) => void;

  /** Reorder exercises (move from one position to another). */
  reorderExercise: (exerciseClientId: string, newPosition: number) => void;

  /** Add a set to an exercise. */
  addSet: (payload: {
    exerciseClientId: string;
    setType?: ActiveSet['setType'];
  }) => void;

  /** Remove a set from an exercise. */
  removeSet: (payload: { exerciseClientId: string; setClientId: string }) => void;

  /** Duplicate a set (copies weight/reps, resets completion). */
  duplicateSet: (payload: { exerciseClientId: string; setClientId: string }) => void;

  /** Update a set's values (weight, reps, etc). */
  updateSet: (
    payload: {
      exerciseClientId: string;
      setClientId: string;
    } & Partial<Pick<ActiveSet, 'weight' | 'reps' | 'durationSeconds' | 'distance' | 'rpe' | 'setType' | 'notes'>>,
  ) => void;

  /** Mark a set as completed. */
  completeSet: (payload: { exerciseClientId: string; setClientId: string }) => void;

  /** Update exercise notes. */
  updateExerciseNotes: (payload: { exerciseClientId: string; notes: string }) => void;

  /** Update workout name. */
  updateWorkoutName: (name: string) => void;

  /** Update workout notes. */
  updateWorkoutNotes: (notes: string) => void;

  /** Start rest timer. */
  startRestTimer: (payload: { seconds: number; exerciseId?: string }) => void;

  /** Stop rest timer. */
  stopRestTimer: () => void;

  /** Tick rest timer (call every second). */
  tickRestTimer: () => void;

  /** Add time to rest timer. */
  addTimeToRestTimer: (seconds: number) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type ActiveWorkoutStore = ActiveWorkout & { hasActiveWorkout: boolean } & WorkoutActions;

const INITIAL_REST_TIMER: RestTimerState = {
  isRunning: false,
  totalSeconds: 0,
  remainingSeconds: 0,
  exerciseId: null,
};

export const useActiveWorkout = create<ActiveWorkoutStore>((set, get) => ({
  // State
  id: '',
  clientUuid: '',
  name: null,
  templateId: null,
  startedAt: '',
  exercises: [],
  notes: '',
  restTimer: INITIAL_REST_TIMER,
  hasActiveWorkout: false,

  // Actions
  startWorkout: (payload) => {
    const now = new Date().toISOString();
    set({
      id: generateUUID(),
      clientUuid: generateUUID(),
      name: payload?.name ?? null,
      templateId: payload?.templateId ?? null,
      startedAt: now,
      exercises: [],
      notes: '',
      restTimer: INITIAL_REST_TIMER,
      hasActiveWorkout: true,
    });
  },

  discardWorkout: () => {
    set({
      id: '',
      clientUuid: '',
      name: null,
      templateId: null,
      startedAt: '',
      exercises: [],
      notes: '',
      restTimer: INITIAL_REST_TIMER,
      hasActiveWorkout: false,
    });
  },

  addExercise: ({ exerciseId, exerciseName, position }) => {
    const state = get();
    const newPos = position ?? state.exercises.length;
    const newExercise: ActiveExercise = {
      id: generateUUID(),
      clientUuid: generateUUID(),
      exerciseId,
      exerciseName,
      position: newPos,
      sets: [],
      notes: '',
    };

    set((s) => {
      const exercises = [...s.exercises];
      exercises.splice(newPos, 0, newExercise);
      return {
        exercises: exercises.map((ex, i) => ({ ...ex, position: i })),
      };
    });
  },

  removeExercise: (exerciseClientId) => {
    set((s) => ({
      exercises: s.exercises
        .filter((ex) => ex.id !== exerciseClientId)
        .map((ex, i) => ({ ...ex, position: i })),
    }));
  },

  reorderExercise: (exerciseClientId, newPosition) => {
    set((s) => {
      const exercises = [...s.exercises];
      const idx = exercises.findIndex((ex) => ex.id === exerciseClientId);
      if (idx === -1) return s;
      const [moved] = exercises.splice(idx, 1);
      exercises.splice(newPosition, 0, moved);
      return {
        exercises: exercises.map((ex, i) => ({ ...ex, position: i })),
      };
    });
  },

  addSet: ({ exerciseClientId, setType = 'normal' }) => {
    set((s) => ({
      exercises: s.exercises.map((ex) => {
        if (ex.id !== exerciseClientId) return ex;
        const nextSetNumber = ex.sets.length + 1;
        const newSet: ActiveSet = {
          id: generateUUID(),
          clientUuid: generateUUID(),
          setNumber: nextSetNumber,
          setType,
          weight: null,
          reps: null,
          durationSeconds: null,
          distance: null,
          rpe: null,
          isCompleted: false,
          completedAt: null,
          notes: '',
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }),
    }));
  },

  removeSet: ({ exerciseClientId, setClientId }) => {
    set((s) => ({
      exercises: s.exercises.map((ex) => {
        if (ex.id !== exerciseClientId) return ex;
        const sets = ex.sets.filter((set) => set.id !== setClientId);
        return {
          ...ex,
          sets: sets.map((set, i) => ({ ...set, setNumber: i + 1 })),
        };
      }),
    }));
  },

  duplicateSet: ({ exerciseClientId, setClientId }) => {
    set((s) => ({
      exercises: s.exercises.map((ex) => {
        if (ex.id !== exerciseClientId) return ex;
        const setIdx = ex.sets.findIndex((set) => set.id === setClientId);
        if (setIdx === -1) return ex;
        const original = ex.sets[setIdx];
        const duplicate: ActiveSet = {
          ...original,
          id: generateUUID(),
          clientUuid: generateUUID(),
          setNumber: ex.sets.length + 1,
          isCompleted: false,
          completedAt: null,
        };
        return { ...ex, sets: [...ex.sets, duplicate] };
      }),
    }));
  },

  updateSet: ({ exerciseClientId, setClientId, ...updates }) => {
    set((s) => ({
      exercises: s.exercises.map((ex) => {
        if (ex.id !== exerciseClientId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set) =>
            set.id === setClientId ? { ...set, ...updates } : set,
          ),
        };
      }),
    }));
  },

  completeSet: ({ exerciseClientId, setClientId }) => {
    set((s) => ({
      exercises: s.exercises.map((ex) => {
        if (ex.id !== exerciseClientId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set) =>
            set.id === setClientId
              ? {
                  ...set,
                  isCompleted: true,
                  completedAt: new Date().toISOString(),
                }
              : set,
          ),
        };
      }),
    }));
  },

  updateExerciseNotes: ({ exerciseClientId, notes }) => {
    set((s) => ({
      exercises: s.exercises.map((ex) =>
        ex.id === exerciseClientId ? { ...ex, notes } : ex,
      ),
    }));
  },

  updateWorkoutName: (name) => set({ name }),
  updateWorkoutNotes: (notes) => set({ notes }),

  startRestTimer: ({ seconds, exerciseId }) => {
    set({
      restTimer: {
        isRunning: true,
        totalSeconds: seconds,
        remainingSeconds: seconds,
        exerciseId: exerciseId ?? null,
      },
    });
  },

  stopRestTimer: () => {
    set({ restTimer: INITIAL_REST_TIMER });
  },

  tickRestTimer: () => {
    const { restTimer } = get();
    if (!restTimer.isRunning) return;
    const remaining = restTimer.remainingSeconds - 1;
    if (remaining <= 0) {
      set({ restTimer: INITIAL_REST_TIMER });
    } else {
      set({
        restTimer: { ...restTimer, remainingSeconds: remaining },
      });
    }
  },

  addTimeToRestTimer: (seconds) => {
    const { restTimer } = get();
    if (!restTimer.isRunning) return;
    set({
      restTimer: {
        ...restTimer,
        totalSeconds: restTimer.totalSeconds + seconds,
        remainingSeconds: restTimer.remainingSeconds + seconds,
      },
    });
  },
}));
