/**
 * Workout templates store — client-side (Layer A, schema-blocked for DB persistence).
 * §14: reusable workouts with name, description, exercises, suggested sets/reps/weight.
 *
 * In production, templates are stored in the DB (workout_templates + workout_template_exercises).
 * This provides the client-side interface that works offline and syncs later.
 */

import { create } from 'zustand';

import { generateUUID } from '@/utils/uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  position: number;
  suggestedSets: number;
  suggestedReps: number;
  suggestedWeight: number | null;
  restSeconds: number;
  notes: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  visibility: 'private' | 'public';
  exercises: TemplateExercise[];
  isPreset: boolean; // built-in templates like Push/Pull/Legs
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface TemplateActions {
  /** Create a new template. */
  createTemplate: (payload: { name: string; description?: string }) => string;

  /** Update template metadata. */
  updateTemplate: (id: string, updates: Partial<Pick<WorkoutTemplate, 'name' | 'description'>>) => void;

  /** Delete a template. */
  deleteTemplate: (id: string) => void;

  /** Duplicate a template with a new name. */
  duplicateTemplate: (id: string, newName?: string) => string | null;

  /** Add an exercise to a template. */
  addExercise: (payload: {
    templateId: string;
    exerciseId: string;
    exerciseName: string;
    position?: number;
  }) => void;

  /** Remove an exercise from a template. */
  removeExercise: (payload: { templateId: string; exerciseId: string }) => void;

  /** Update exercise suggestions in a template. */
  updateExercise: (payload: {
    templateId: string;
    exerciseId: string;
    updates: Partial<Pick<TemplateExercise, 'suggestedSets' | 'suggestedReps' | 'suggestedWeight' | 'restSeconds' | 'notes'>>;
  }) => void;

  /** Reorder exercises in a template. */
  reorderExercise: (payload: { templateId: string; exerciseId: string; newPosition: number }) => void;

  /** Save a completed workout as a new template. */
  saveWorkoutAsTemplate: (payload: {
    name: string;
    exercises: { exerciseId: string; exerciseName: string; sets: { weight: number | null; reps: number | null }[] }[];
  }) => string;

  /** Initialize with preset templates. */
  initPresets: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type TemplateStore = { templates: WorkoutTemplate[] } & TemplateActions;

export const useTemplates = create<TemplateStore>((set, get) => ({
  templates: [],

  createTemplate: ({ name, description = '' }) => {
    const id = generateUUID();
    const now = new Date().toISOString();
    const template: WorkoutTemplate = {
      id,
      name,
      description,
      visibility: 'private',
      exercises: [],
      isPreset: false,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ templates: [...s.templates, template] }));
    return id;
  },

  updateTemplate: (id, updates) => {
    set((s) => ({
      templates: s.templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
      ),
    }));
  },

  deleteTemplate: (id) => {
    set((s) => ({
      templates: s.templates.filter((t) => t.id !== id),
    }));
  },

  duplicateTemplate: (id, newName) => {
    const original = get().templates.find((t) => t.id === id);
    if (!original) return null;

    const newId = generateUUID();
    const now = new Date().toISOString();
    const duplicate: WorkoutTemplate = {
      ...original,
      id: newId,
      name: newName ?? `${original.name} (Copy)`,
      isPreset: false,
      createdAt: now,
      updatedAt: now,
      exercises: original.exercises.map((ex) => ({
        ...ex,
        id: generateUUID(),
      })),
    };
    set((s) => ({ templates: [...s.templates, duplicate] }));
    return newId;
  },

  addExercise: ({ templateId, exerciseId, exerciseName, position }) => {
    set((s) => ({
      templates: s.templates.map((t) => {
        if (t.id !== templateId) return t;
        const newPos = position ?? t.exercises.length;
        const newExercise: TemplateExercise = {
          id: generateUUID(),
          exerciseId,
          exerciseName,
          position: newPos,
          suggestedSets: 3,
          suggestedReps: 10,
          suggestedWeight: null,
          restSeconds: 90,
          notes: '',
        };
        const exercises = [...t.exercises];
        exercises.splice(newPos, 0, newExercise);
        return {
          ...t,
          exercises: exercises.map((ex, i) => ({ ...ex, position: i })),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  removeExercise: ({ templateId, exerciseId }) => {
    set((s) => ({
      templates: s.templates.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          exercises: t.exercises
            .filter((ex) => ex.id !== exerciseId)
            .map((ex, i) => ({ ...ex, position: i })),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  updateExercise: ({ templateId, exerciseId, updates }) => {
    set((s) => ({
      templates: s.templates.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          exercises: t.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, ...updates } : ex,
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  reorderExercise: ({ templateId, exerciseId, newPosition }) => {
    set((s) => ({
      templates: s.templates.map((t) => {
        if (t.id !== templateId) return t;
        const exercises = [...t.exercises];
        const idx = exercises.findIndex((ex) => ex.id === exerciseId);
        if (idx === -1) return t;
        const [moved] = exercises.splice(idx, 1);
        exercises.splice(newPosition, 0, moved);
        return {
          ...t,
          exercises: exercises.map((ex, i) => ({ ...ex, position: i })),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  saveWorkoutAsTemplate: ({ name, exercises }) => {
    const id = get().createTemplate({ name });
    const templateId = id;

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const avgWeight = ex.sets.reduce((sum, s) => sum + (s.weight ?? 0), 0) / ex.sets.length;
      const avgReps = ex.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0) / ex.sets.length;

      get().addExercise({
        templateId,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        position: i,
      });

      const templateEx = get().templates
        .find((t) => t.id === templateId)
        ?.exercises.find((e) => e.exerciseId === ex.exerciseId);

      if (templateEx) {
        get().updateExercise({
          templateId,
          exerciseId: templateEx.id,
          updates: {
            suggestedSets: ex.sets.length,
            suggestedReps: Math.round(avgReps),
            suggestedWeight: avgWeight > 0 ? Math.round(avgWeight) : null,
          },
        });
      }
    }

    return id;
  },

  initPresets: () => {
    const { templates } = get();
    if (templates.some((t) => t.isPreset)) return; // already initialized

    const presets: WorkoutTemplate[] = [
      {
        id: 'preset-push',
        name: 'Push Day',
        description: 'Chest, shoulders, and triceps',
        visibility: 'private',
        isPreset: true,
        exercises: [
          { id: 'pe-1', exerciseId: 'bench-press', exerciseName: 'Bench Press', position: 0, suggestedSets: 4, suggestedReps: 8, suggestedWeight: null, restSeconds: 120, notes: '' },
          { id: 'pe-2', exerciseId: 'overhead-press', exerciseName: 'Overhead Press', position: 1, suggestedSets: 3, suggestedReps: 10, suggestedWeight: null, restSeconds: 90, notes: '' },
          { id: 'pe-3', exerciseId: 'incline-dumbbell-press', exerciseName: 'Incline Dumbbell Press', position: 2, suggestedSets: 3, suggestedReps: 10, suggestedWeight: null, restSeconds: 90, notes: '' },
          { id: 'pe-4', exerciseId: 'lateral-raise', exerciseName: 'Lateral Raise', position: 3, suggestedSets: 3, suggestedReps: 12, suggestedWeight: null, restSeconds: 60, notes: '' },
          { id: 'pe-5', exerciseId: 'tricep-pushdown', exerciseName: 'Triceps Pushdown', position: 4, suggestedSets: 3, suggestedReps: 12, suggestedWeight: null, restSeconds: 60, notes: '' },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'preset-pull',
        name: 'Pull Day',
        description: 'Back and biceps',
        visibility: 'private',
        isPreset: true,
        exercises: [
          { id: 'pe-6', exerciseId: 'pull-up', exerciseName: 'Pull Up', position: 0, suggestedSets: 4, suggestedReps: 8, suggestedWeight: null, restSeconds: 120, notes: '' },
          { id: 'pe-7', exerciseId: 'barbell-row', exerciseName: 'Barbell Row', position: 1, suggestedSets: 4, suggestedReps: 8, suggestedWeight: null, restSeconds: 120, notes: '' },
          { id: 'pe-8', exerciseId: 'seated-cable-row', exerciseName: 'Seated Cable Row', position: 2, suggestedSets: 3, suggestedReps: 10, suggestedWeight: null, restSeconds: 90, notes: '' },
          { id: 'pe-9', exerciseId: 'face-pull', exerciseName: 'Face Pull', position: 3, suggestedSets: 3, suggestedReps: 15, suggestedWeight: null, restSeconds: 60, notes: '' },
          { id: 'pe-10', exerciseId: 'dumbbell-curl', exerciseName: 'Dumbbell Curl', position: 4, suggestedSets: 3, suggestedReps: 10, suggestedWeight: null, restSeconds: 60, notes: '' },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'preset-legs',
        name: 'Leg Day',
        description: 'Quads, hamstrings, and glutes',
        visibility: 'private',
        isPreset: true,
        exercises: [
          { id: 'pe-11', exerciseId: 'barbell-squat', exerciseName: 'Barbell Squat', position: 0, suggestedSets: 4, suggestedReps: 6, suggestedWeight: null, restSeconds: 180, notes: '' },
          { id: 'pe-12', exerciseId: 'romanian-deadlift', exerciseName: 'Romanian Deadlift', position: 1, suggestedSets: 3, suggestedReps: 10, suggestedWeight: null, restSeconds: 120, notes: '' },
          { id: 'pe-13', exerciseId: 'leg-press', exerciseName: 'Leg Press', position: 2, suggestedSets: 3, suggestedReps: 12, suggestedWeight: null, restSeconds: 90, notes: '' },
          { id: 'pe-14', exerciseId: 'leg-curl', exerciseName: 'Leg Curl', position: 3, suggestedSets: 3, suggestedReps: 12, suggestedWeight: null, restSeconds: 60, notes: '' },
          { id: 'pe-15', exerciseId: 'calf-raise', exerciseName: 'Calf Raise', position: 4, suggestedSets: 3, suggestedReps: 15, suggestedWeight: null, restSeconds: 60, notes: '' },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    set((s) => ({ templates: [...s.templates, ...presets] }));
  },
}));
