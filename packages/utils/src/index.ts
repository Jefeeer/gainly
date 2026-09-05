// @gainly/utils — shared pure utilities (units, 1RM/PR math, workout/nutrition metrics).
export { calculateE1RM } from './e1rm';
export { isNewPersonalRecord, detectMaxRepsPR } from './personal-records';
export {
  computeDuration,
  aggregateWorkoutMetrics,
  buildWorkoutMetrics,
  type SetForMetrics,
  type ExerciseForMetrics,
  type WorkoutMetrics,
} from './workout-metrics';
export {
  toLocalDate,
  filterByDate,
  sumFoodLogs,
  sumWaterLogs,
  computeDailyNutrition,
  computeRemainingCalories,
  computeRemainingMacros,
  emptyNutritionTotals,
  type FoodLogEntry,
  type WaterLogEntry,
  type DailyNutritionTotals,
} from './nutrition-metrics';
export {
  kgToLb,
  lbToKg,
  cmToInches,
  inchesToCm,
  kmToMiles,
  milesToKm,
  mlToFlOz,
  flOzToMl,
  formatWeight,
  formatDistance,
  formatMeasurement,
  formatVolume,
} from './units';
