import { describe, expect, it } from 'vitest';

import {
  computeDailyNutrition,
  computeRemainingCalories,
  computeRemainingMacros,
  emptyNutritionTotals,
  filterByDate,
  sumFoodLogs,
  sumWaterLogs,
  toLocalDate,
} from './nutrition-metrics';

describe('toLocalDate', () => {
  it('extracts YYYY-MM-DD from a UTC ISO timestamp', () => {
    // This test assumes the system timezone is not UTC-12 or UTC+14
    // For a real app, timezone would be configurable
    expect(toLocalDate('2026-09-01T10:00:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('produces a parseable date string', () => {
    const result = toLocalDate('2026-09-01T10:00:00Z');
    const parsed = new Date(result + 'T00:00:00');
    expect(parsed).toBeInstanceOf(Date);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });
});

describe('filterByDate', () => {
  it('filters entries matching the target date', () => {
    const entries = [
      { logged_at: '2026-09-01T08:00:00Z', value: 1 },
      { logged_at: '2026-09-01T20:00:00Z', value: 2 },
      { logged_at: '2026-09-02T08:00:00Z', value: 3 },
    ];
    // Use toLocalDate to get the actual date string for the first entry
    const targetDate = toLocalDate(entries[0].logged_at);
    const result = filterByDate(entries, targetDate);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.value)).toEqual([1, 2]);
  });

  it('returns empty array when no entries match', () => {
    const entries = [{ logged_at: '2026-09-01T08:00:00Z' }];
    const result = filterByDate(entries, '2099-01-01');
    expect(result).toHaveLength(0);
  });
});

describe('sumFoodLogs', () => {
  it('sums all macro fields, treating null as 0', () => {
    const entries = [
      { calories: 500, protein_g: 30, carbs_g: 50, fat_g: 20, fiber_g: 5, logged_at: '' },
      { calories: 300, protein_g: null, carbs_g: 40, fat_g: 10, fiber_g: null, logged_at: '' },
    ];
    const result = sumFoodLogs(entries);
    expect(result.calories).toBe(800);
    expect(result.protein_g).toBe(30); // null treated as 0
    expect(result.carbs_g).toBe(90);
    expect(result.fat_g).toBe(30);
    expect(result.fiber_g).toBe(5);
  });

  it('returns zeros for empty entries', () => {
    const result = sumFoodLogs([]);
    expect(result.calories).toBe(0);
    expect(result.protein_g).toBe(0);
    expect(result.carbs_g).toBe(0);
    expect(result.fat_g).toBe(0);
    expect(result.fiber_g).toBe(0);
  });
});

describe('sumWaterLogs', () => {
  it('sums amount_ml across entries', () => {
    const entries = [
      { amount_ml: 250, logged_at: '' },
      { amount_ml: 500, logged_at: '' },
    ];
    expect(sumWaterLogs(entries)).toBe(750);
  });

  it('returns 0 for empty entries', () => {
    expect(sumWaterLogs([])).toBe(0);
  });
});

describe('emptyNutritionTotals', () => {
  it('has all zero values', () => {
    expect(emptyNutritionTotals.calories).toBe(0);
    expect(emptyNutritionTotals.protein_g).toBe(0);
    expect(emptyNutritionTotals.water_ml).toBe(0);
  });
});

describe('computeDailyNutrition', () => {
  it('combines food and water totals for the target date', () => {
    const foodLogs = [
      { calories: 500, protein_g: 30, carbs_g: 50, fat_g: 20, fiber_g: 5, logged_at: '2026-09-01T08:00:00Z' },
      { calories: 300, protein_g: 20, carbs_g: 30, fat_g: 10, fiber_g: 3, logged_at: '2026-09-02T08:00:00Z' },
    ];
    const waterLogs = [
      { amount_ml: 250, logged_at: '2026-09-01T09:00:00Z' },
      { amount_ml: 500, logged_at: '2026-09-02T09:00:00Z' },
    ];
    const date1 = toLocalDate('2026-09-01T08:00:00Z');
    const result = computeDailyNutrition(foodLogs, waterLogs, date1);
    expect(result.calories).toBe(500);
    expect(result.water_ml).toBe(250);
  });
});

describe('computeRemainingCalories', () => {
  it('returns goal minus consumed', () => {
    expect(computeRemainingCalories(2400, 1800)).toBe(600);
  });

  it('returns negative when over goal', () => {
    expect(computeRemainingCalories(2400, 2600)).toBe(-200);
  });

  it('returns null when no goal is set', () => {
    expect(computeRemainingCalories(null, 1800)).toBeNull();
  });
});

describe('computeRemainingMacros', () => {
  it('subtracts consumed from goals', () => {
    const result = computeRemainingMacros(
      { protein_g: 180, carbs_g: 250, fat_g: 70 },
      { protein_g: 120, carbs_g: 180, fat_g: 50 },
    );
    expect(result.protein_g).toBe(60);
    expect(result.carbs_g).toBe(70);
    expect(result.fat_g).toBe(20);
  });

  it('returns null for macros without goals', () => {
    const result = computeRemainingMacros(
      { protein_g: null, carbs_g: 250, fat_g: null },
      { protein_g: 120, carbs_g: 180, fat_g: 50 },
    );
    expect(result.protein_g).toBeNull();
    expect(result.carbs_g).toBe(70);
    expect(result.fat_g).toBeNull();
  });
});
