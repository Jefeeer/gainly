// @gainly/types — enum types, hand-authored from the FROZEN migration DDL
// (supabase/migrations/20260902142100_initial_schema.sql §1), cross-checked against docs/database.md.
// These mirror the 18 Postgres `create type ... as enum` sets 1:1. After G-52 applies the migration,
// `supabase gen types` will emit the same string-literal unions — reconciliation should be a diff.

export type MeasurementSystem = 'metric' | 'imperial';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type FitnessGoal =
  | 'build_muscle'
  | 'lose_weight'
  | 'get_stronger'
  | 'improve_fitness'
  | 'maintain_weight'
  | 'improve_endurance';

export type BiologicalSex = 'male' | 'female' | 'unspecified';

export type ExerciseType =
  | 'weight_reps'
  | 'reps'
  | 'duration'
  | 'distance'
  | 'weight_duration'
  | 'distance_duration'
  | 'assisted_weight';

export type SetType = 'warmup' | 'normal' | 'drop' | 'failure' | 'superset';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type ExerciseSource = 'gainly' | 'workout_guide' | 'user' | 'admin' | 'imported';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export type PrType = 'max_weight' | 'max_e1rm' | 'max_reps' | 'max_volume' | 'best_distance' | 'best_duration';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type NutritionGoalMode = 'lose' | 'maintain' | 'gain';

export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_annual';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export type SubscriptionProvider = 'stripe' | 'apple' | 'google';

export type HealthProvider = 'apple_health' | 'android_health';

export type TemplateVisibility = 'private' | 'public';

export type ProgramStatus = 'draft' | 'active' | 'completed' | 'archived';
