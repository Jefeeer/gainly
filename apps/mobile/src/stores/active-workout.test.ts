import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useActiveWorkout } from './active-workout';

// Reset store between tests
beforeEach(() => {
  useActiveWorkout.getState().discardWorkout();
});

describe('startWorkout', () => {
  it('creates a new workout with generated IDs', () => {
    useActiveWorkout.getState().startWorkout();
    const state = useActiveWorkout.getState();
    expect(state.hasActiveWorkout).toBe(true);
    expect(state.id).toBeTruthy();
    expect(state.clientUuid).toBeTruthy();
    expect(state.exercises).toEqual([]);
    expect(state.startedAt).toBeTruthy();
  });

  it('sets name and templateId when provided', () => {
    useActiveWorkout.getState().startWorkout({ name: 'Push Day', templateId: 'tpl-1' });
    const state = useActiveWorkout.getState();
    expect(state.name).toBe('Push Day');
    expect(state.templateId).toBe('tpl-1');
  });
});

describe('discardWorkout', () => {
  it('clears all workout state', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().discardWorkout();
    const state = useActiveWorkout.getState();
    expect(state.hasActiveWorkout).toBe(false);
    expect(state.exercises).toEqual([]);
  });
});

describe('addExercise', () => {
  it('adds an exercise at the end by default', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
    });
    const state = useActiveWorkout.getState();
    expect(state.exercises).toHaveLength(1);
    expect(state.exercises[0].exerciseId).toBe('bench-press');
    expect(state.exercises[0].position).toBe(0);
  });

  it('adds an exercise at a specific position', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({ exerciseId: 'a', exerciseName: 'A' });
    useActiveWorkout.getState().addExercise({ exerciseId: 'b', exerciseName: 'B' });
    useActiveWorkout.getState().addExercise({ exerciseId: 'c', exerciseName: 'C', position: 1 });
    const state = useActiveWorkout.getState();
    expect(state.exercises.map((e) => e.exerciseId)).toEqual(['a', 'c', 'b']);
    expect(state.exercises[1].position).toBe(1);
  });
});

describe('removeExercise', () => {
  it('removes an exercise and re-indexes positions', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({ exerciseId: 'a', exerciseName: 'A' });
    useActiveWorkout.getState().addExercise({ exerciseId: 'b', exerciseName: 'B' });
    useActiveWorkout.getState().addExercise({ exerciseId: 'c', exerciseName: 'C' });

    const exB = useActiveWorkout.getState().exercises[1];
    useActiveWorkout.getState().removeExercise(exB.id);

    const state = useActiveWorkout.getState();
    expect(state.exercises).toHaveLength(2);
    expect(state.exercises.map((e) => e.exerciseId)).toEqual(['a', 'c']);
    expect(state.exercises[0].position).toBe(0);
    expect(state.exercises[1].position).toBe(1);
  });
});

describe('addSet / removeSet', () => {
  it('adds sets with incrementing set numbers', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({ exerciseId: 'a', exerciseName: 'A' });
    const exId = useActiveWorkout.getState().exercises[0].id;

    useActiveWorkout.getState().addSet({ exerciseClientId: exId });
    useActiveWorkout.getState().addSet({ exerciseClientId: exId });

    const sets = useActiveWorkout.getState().exercises[0].sets;
    expect(sets).toHaveLength(2);
    expect(sets[0].setNumber).toBe(1);
    expect(sets[1].setNumber).toBe(2);
  });

  it('removes a set and re-numbers', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({ exerciseId: 'a', exerciseName: 'A' });
    const exId = useActiveWorkout.getState().exercises[0].id;

    useActiveWorkout.getState().addSet({ exerciseClientId: exId });
    useActiveWorkout.getState().addSet({ exerciseClientId: exId });
    useActiveWorkout.getState().addSet({ exerciseClientId: exId });

    const set2 = useActiveWorkout.getState().exercises[0].sets[1];
    useActiveWorkout.getState().removeSet({ exerciseClientId: exId, setClientId: set2.id });

    const sets = useActiveWorkout.getState().exercises[0].sets;
    expect(sets).toHaveLength(2);
    expect(sets[0].setNumber).toBe(1);
    expect(sets[1].setNumber).toBe(2);
  });
});

describe('updateSet', () => {
  it('updates weight and reps on a set', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({ exerciseId: 'a', exerciseName: 'A' });
    const exId = useActiveWorkout.getState().exercises[0].id;
    useActiveWorkout.getState().addSet({ exerciseClientId: exId });
    const setId = useActiveWorkout.getState().exercises[0].sets[0].id;

    useActiveWorkout.getState().updateSet({
      exerciseClientId: exId,
      setClientId: setId,
      weight: 100,
      reps: 8,
    });

    const set = useActiveWorkout.getState().exercises[0].sets[0];
    expect(set.weight).toBe(100);
    expect(set.reps).toBe(8);
  });
});

describe('completeSet', () => {
  it('marks a set as completed with a timestamp', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({ exerciseId: 'a', exerciseName: 'A' });
    const exId = useActiveWorkout.getState().exercises[0].id;
    useActiveWorkout.getState().addSet({ exerciseClientId: exId });
    const setId = useActiveWorkout.getState().exercises[0].sets[0].id;

    useActiveWorkout.getState().completeSet({ exerciseClientId: exId, setClientId: setId });

    const set = useActiveWorkout.getState().exercises[0].sets[0];
    expect(set.isCompleted).toBe(true);
    expect(set.completedAt).toBeTruthy();
  });
});

describe('duplicateSet', () => {
  it('creates a copy with new ID, preserving weight/reps, resetting completion', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({ exerciseId: 'a', exerciseName: 'A' });
    const exId = useActiveWorkout.getState().exercises[0].id;
    useActiveWorkout.getState().addSet({ exerciseClientId: exId });
    const setId = useActiveWorkout.getState().exercises[0].sets[0].id;

    useActiveWorkout.getState().updateSet({
      exerciseClientId: exId,
      setClientId: setId,
      weight: 100,
      reps: 8,
    });
    useActiveWorkout.getState().completeSet({ exerciseClientId: exId, setClientId: setId });
    useActiveWorkout.getState().duplicateSet({ exerciseClientId: exId, setClientId: setId });

    const sets = useActiveWorkout.getState().exercises[0].sets;
    expect(sets).toHaveLength(2);
    expect(sets[1].weight).toBe(100);
    expect(sets[1].reps).toBe(8);
    expect(sets[1].isCompleted).toBe(false);
    expect(sets[1].completedAt).toBeNull();
    expect(sets[1].id).not.toBe(sets[0].id);
  });
});

describe('reorderExercise', () => {
  it('moves an exercise to a new position', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({ exerciseId: 'a', exerciseName: 'A' });
    useActiveWorkout.getState().addExercise({ exerciseId: 'b', exerciseName: 'B' });
    useActiveWorkout.getState().addExercise({ exerciseId: 'c', exerciseName: 'C' });

    const exA = useActiveWorkout.getState().exercises[0];
    useActiveWorkout.getState().reorderExercise(exA.id, 2);

    const ids = useActiveWorkout.getState().exercises.map((e) => e.exerciseId);
    expect(ids).toEqual(['b', 'c', 'a']);
  });
});

describe('rest timer', () => {
  it('starts, ticks, and stops the rest timer', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().startRestTimer({ seconds: 90 });

    let state = useActiveWorkout.getState();
    expect(state.restTimer.isRunning).toBe(true);
    expect(state.restTimer.remainingSeconds).toBe(90);

    useActiveWorkout.getState().tickRestTimer();
    state = useActiveWorkout.getState();
    expect(state.restTimer.remainingSeconds).toBe(89);

    useActiveWorkout.getState().stopRestTimer();
    state = useActiveWorkout.getState();
    expect(state.restTimer.isRunning).toBe(false);
  });

  it('auto-stops when timer reaches zero', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().startRestTimer({ seconds: 2 });
    useActiveWorkout.getState().tickRestTimer();
    useActiveWorkout.getState().tickRestTimer();

    const state = useActiveWorkout.getState();
    expect(state.restTimer.isRunning).toBe(false);
    expect(state.restTimer.remainingSeconds).toBe(0);
  });

  it('adds time to running timer', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().startRestTimer({ seconds: 60 });
    useActiveWorkout.getState().addTimeToRestTimer(30);

    const state = useActiveWorkout.getState();
    expect(state.restTimer.remainingSeconds).toBe(90);
    expect(state.restTimer.totalSeconds).toBe(90);
  });
});

describe('client UUID idempotency', () => {
  it('each exercise and set has a unique client UUID', () => {
    useActiveWorkout.getState().startWorkout();
    useActiveWorkout.getState().addExercise({ exerciseId: 'a', exerciseName: 'A' });
    useActiveWorkout.getState().addExercise({ exerciseId: 'b', exerciseName: 'B' });
    const exId = useActiveWorkout.getState().exercises[0].id;
    useActiveWorkout.getState().addSet({ exerciseClientId: exId });
    useActiveWorkout.getState().addSet({ exerciseClientId: exId });

    const exercises = useActiveWorkout.getState().exercises;
    const clientUuids = exercises.map((e) => e.clientUuid);
    expect(new Set(clientUuids).size).toBe(clientUuids.length);

    const sets = exercises[0].sets;
    const setClientUuids = sets.map((s) => s.clientUuid);
    expect(new Set(setClientUuids).size).toBe(setClientUuids.length);
  });
});
