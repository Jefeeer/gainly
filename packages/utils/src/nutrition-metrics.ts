// Nutrition metrics — daily totals and local-date grouping.
// §22-§25 (nutrition tracking), §88 (timestamps stored in UTC, display by local date).
// Pure functions, no database dependency.

/** A food log entry with the fields needed for daily aggregation. */
export interface FoodLogEntry {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  logged_at: string; // ISO timestamp (UTC)
}

/** A water log entry. */
export interface WaterLogEntry {
  amount_ml: number;
  logged_at: string;
}

/** Aggregated daily nutrition totals. */
export interface DailyNutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  water_ml: number;
}

/** Empty/default totals — all zeros. */
export const emptyNutritionTotals: DailyNutritionTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  water_ml: 0,
};

/**
 * Get the local date string (YYYY-MM-DD) from a UTC ISO timestamp.
 * §88: "Nutrition should group by the user's local date."
 * This uses the system timezone; in a real app the user's configured timezone
 * would be passed in, but for MVP this is sufficient.
 */
export function toLocalDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  // Use local timezone components, not UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Filter food log entries to a specific local date (YYYY-MM-DD).
 */
export function filterByDate<T extends { logged_at: string }>(
  entries: T[],
  targetDate: string,
): T[] {
  return entries.filter((entry) => toLocalDate(entry.logged_at) === targetDate);
}

/**
 * Sum food log entries into daily nutrition totals.
 * Null fields are treated as 0.
 */
export function sumFoodLogs(entries: FoodLogEntry[]): Omit<DailyNutritionTotals, 'water_ml'> {
  let calories = 0;
  let protein_g = 0;
  let carbs_g = 0;
  let fat_g = 0;
  let fiber_g = 0;

  for (const entry of entries) {
    calories += entry.calories ?? 0;
    protein_g += entry.protein_g ?? 0;
    carbs_g += entry.carbs_g ?? 0;
    fat_g += entry.fat_g ?? 0;
    fiber_g += entry.fiber_g ?? 0;
  }

  return { calories, protein_g, carbs_g, fat_g, fiber_g };
}

/**
 * Sum water log entries to a total ml amount.
 */
export function sumWaterLogs(entries: WaterLogEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount_ml, 0);
}

/**
 * Compute full daily nutrition totals from food and water logs for a given date.
 */
export function computeDailyNutrition(
  foodLogs: FoodLogEntry[],
  waterLogs: WaterLogEntry[],
  targetDate: string,
): DailyNutritionTotals {
  const foodsForDate = filterByDate(foodLogs, targetDate);
  const waterForDate = filterByDate(waterLogs, targetDate);
  const foodTotals = sumFoodLogs(foodsForDate);

  return {
    ...foodTotals,
    water_ml: sumWaterLogs(waterForDate),
  };
}

/**
 * Compute remaining calories: goal minus consumed.
 * Returns null if no calorie goal is set.
 */
export function computeRemainingCalories(
  calorieGoal: number | null,
  consumed: number,
): number | null {
  if (calorieGoal === null) return null;
  return calorieGoal - consumed;
}

/**
 * Compute remaining macros as an object of remaining amounts.
 * Returns null for any macro without a goal.
 */
export function computeRemainingMacros(
  goals: { protein_g: number | null; carbs_g: number | null; fat_g: number | null },
  consumed: { protein_g: number; carbs_g: number; fat_g: number },
): { protein_g: number | null; carbs_g: number | null; fat_g: number | null } {
  return {
    protein_g: goals.protein_g !== null ? goals.protein_g - consumed.protein_g : null,
    carbs_g: goals.carbs_g !== null ? goals.carbs_g - consumed.carbs_g : null,
    fat_g: goals.fat_g !== null ? goals.fat_g - consumed.fat_g : null,
  };
}
