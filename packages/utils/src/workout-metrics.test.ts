import { describe, expect, it } from 'vitest';

import {
  aggregateWorkoutMetrics,
  buildWorkoutMetrics,
  computeDuration,
  type ExerciseForMetrics,
} from './workout-metrics';

describe('computeDuration', () => {
  it('returns seconds between two timestamps', () => {
    const start = '2026-09-01T10:00:00Z';
    const end = '2026-09-01T10:45:00Z';
    expect(computeDuration(start, end)).toBe(2700); // 45 minutes
  });

  it('returns null when endedAt is null', () => {
    expect(computeDuration('2026-09-01T10:00:00Z', null)).toBeNull();
  });

  it('returns 0 for same timestamps', () => {
    const t = '2026-09-01T10:00:00Z';
    expect(computeDuration(t, t)).toBe(0);
  });

  it('floors fractional seconds', () => {
    const start = '2026-09-01T10:00:00.000Z';
    const end = '2026-09-01T10:00:01.999Z';
    expect(computeDuration(start, end)).toBe(1);
  });
});

describe('aggregateWorkoutMetrics', () => {
  const makeSet = (
    overrides: Partial<{ weight: number | null; reps: number | null; is_completed: boolean; set_type: string }> = {},
  ) => ({
    weight: null as number | null,
    reps: null as number | null,
    duration_seconds: null as number | null,
    distance: null as number | null,
    is_completed: true,
    set_type: 'normal',
    ...overrides,
  });

  it('counts all sets (completed and not) in total_sets', () => {
    const exercises: ExerciseForMetrics[] = [
      {
        sets: [
          makeSet({ is_completed: true }),
          makeSet({ is_completed: false }),
          makeSet({ is_completed: true }),
        ],
      },
    ];
    const result = aggregateWorkoutMetrics(exercises);
    expect(result.total_sets).toBe(3);
    expect(result.completed_sets).toBe(2);
  });

  it('computes volume as weight × reps for completed sets', () => {
    const exercises: ExerciseForMetrics[] = [
      {
        sets: [
          makeSet({ weight: 100, reps: 5, is_completed: true }),
          makeSet({ weight: 80, reps: 8, is_completed: true }),
        ],
      },
    ];
    const result = aggregateWorkoutMetrics(exercises);
    // 100*5 + 80*8 = 500 + 640 = 1140
    expect(result.total_volume).toBe(1140);
  });

  it('skips volume for sets with null weight or null reps', () => {
    const exercises: ExerciseForMetrics[] = [
      {
        sets: [
          makeSet({ weight: 100, reps: null }),
          makeSet({ weight: null, reps: 10 }),
          makeSet({ weight: 100, reps: 5 }),
        ],
      },
    ];
    const result = aggregateWorkoutMetrics(exercises);
    expect(result.total_volume).toBe(500); // only the third set contributes
  });

  it('sums reps across all exercises', () => {
    const exercises: ExerciseForMetrics[] = [
      { sets: [makeSet({ reps: 8 }), makeSet({ reps: 7 })] },
      { sets: [makeSet({ reps: 10 })] },
    ];
    const result = aggregateWorkoutMetrics(exercises);
    expect(result.total_reps).toBe(25);
  });

  it('returns empty metrics for no exercises', () => {
    const result = aggregateWorkoutMetrics([]);
    expect(result.total_sets).toBe(0);
    expect(result.completed_sets).toBe(0);
    expect(result.total_reps).toBe(0);
    expect(result.total_volume).toBe(0);
    expect(result.duration_seconds).toBeNull();
  });

  it('counts warm-up sets in total and completed', () => {
    const exercises: ExerciseForMetrics[] = [
      {
        sets: [
          makeSet({ set_type: 'warmup', is_completed: true }),
          makeSet({ set_type: 'normal', is_completed: true }),
        ],
      },
    ];
    const result = aggregateWorkoutMetrics(exercises);
    expect(result.total_sets).toBe(2);
    expect(result.completed_sets).toBe(2);
  });
});

describe('buildWorkoutMetrics', () => {
  it('includes duration from timestamps', () => {
    const exercises: ExerciseForMetrics[] = [
      {
        sets: [
          { weight: 100, reps: 5, duration_seconds: null, distance: null, is_completed: true, set_type: 'normal' },
        ],
      },
    ];
    const result = buildWorkoutMetrics(
      '2026-09-01T10:00:00Z',
      '2026-09-01T10:30:00Z',
      exercises,
    );
    expect(result.duration_seconds).toBe(1800);
    expect(result.total_volume).toBe(500);
  });
});
