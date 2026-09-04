// @gainly/types — table row types, hand-authored from the FROZEN migration DDL
// (supabase/migrations/20260902142100_initial_schema.sql), cross-checked against docs/database.md.
// One interface per table = the SELECT-row shape. After G-52 applies the migration,
// `supabase gen types` reconciles against these; write them so that is a field-level diff, not a rewrite.
//
// SQL -> TS mapping (matches what `supabase gen types` emits):
//   uuid | text | timestamptz | date  -> string      (timestamps/dates are ISO strings over the wire)
//   int | smallint | numeric          -> number
//   boolean                           -> boolean
//   jsonb                             -> Json
//   text[]                            -> string[]
//   <pg enum>                         -> the union from ./enums
// Nullability: a field is `| null` iff the column is NOT `not null` (defaults do not affect the row shape).
// CHECK-constrained text columns are typed `string` (a CHECK is not a pg enum, so gen types keeps them
// `string`); the allowed set is noted inline so P1-VALID can encode it without re-reading the SQL.

import type {
  BiologicalSex,
  DifficultyLevel,
  ExerciseSource,
  ExerciseType,
  ExperienceLevel,
  FitnessGoal,
  GoalStatus,
  HealthProvider,
  MealType,
  MeasurementSystem,
  NutritionGoalMode,
  PrType,
  ProgramStatus,
  SetType,
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus,
  TemplateVisibility,
} from './enums';

/** Recursive JSON value — matches the `Json` type `supabase gen types` emits for jsonb columns. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// --- Lookup tables ---------------------------------------------------------

export interface Muscle {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Equipment {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

// --- Profiles --------------------------------------------------------------

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  biological_sex: BiologicalSex;
  height_cm: number | null;
  fitness_goal: FitnessGoal | null;
  experience_level: ExperienceLevel | null;
  measurement_system: MeasurementSystem;
  training_days_per_week: number | null;
  is_admin: boolean;
  onboarding_completed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Exercise library ------------------------------------------------------

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  exercise_type: ExerciseType;
  equipment_id: string | null;
  category_id: string | null;
  difficulty: DifficultyLevel | null;
  image_url: string | null;
  local_asset_key: string | null;
  video_url: string | null;
  source: ExerciseSource;
  external_source: string | null;
  external_id: string | null;
  external_slug: string | null;
  asset_provider: string | null;
  asset_key: string | null;
  asset_frame_count: number | null;
  is_custom: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseMuscle {
  exercise_id: string;
  muscle_id: string;
  role: string; // CHECK in ('primary','secondary')
}

export interface ExerciseAlias {
  id: string;
  exercise_id: string;
  alias: string;
  normalized_alias: string;
  created_at: string;
}

export interface ExerciseFavorite {
  user_id: string;
  exercise_id: string;
  created_at: string;
}

// --- User settings & goals -------------------------------------------------

export interface UserSettings {
  user_id: string;
  theme: string; // CHECK in ('system','light','dark')
  weight_unit: string; // CHECK in ('kg','lb')
  distance_unit: string; // CHECK in ('km','miles')
  measurement_unit: string; // CHECK in ('cm','inches')
  volume_unit: string; // CHECK in ('ml','fl_oz')
  default_rest_seconds: number;
  auto_start_rest_timer: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  title: string;
  goal_type: string; // free text: body_weight|lift|frequency|body_fat|distance|custom (no CHECK)
  exercise_id: string | null;
  starting_value: number | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  target_date: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// --- Templates & programs --------------------------------------------------

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  visibility: TemplateVisibility;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  position: number;
  suggested_sets: number | null;
  suggested_reps: number | null;
  suggested_weight: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

export interface Program {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  duration_weeks: number | null;
  start_date: string | null;
  status: ProgramStatus;
  created_at: string;
  updated_at: string;
}

export interface ProgramWeek {
  id: string;
  program_id: string;
  week_number: number;
}

export interface ProgramDay {
  id: string;
  program_week_id: string;
  day_of_week: number; // CHECK between 1 and 7 (Mon=1)
  is_rest_day: boolean;
  label: string | null;
}

export interface ProgramWorkout {
  id: string;
  program_day_id: string;
  template_id: string;
  position: number;
  progression_note: string | null;
}

// --- Workout tracking ------------------------------------------------------

export interface WorkoutSession {
  id: string;
  user_id: string;
  template_id: string | null;
  program_day_id: string | null;
  name: string | null;
  status: string; // CHECK in ('active','completed','discarded')
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  duration_seconds: number | null;
  total_sets: number | null;
  completed_sets: number | null;
  total_reps: number | null;
  total_volume: number | null;
  client_uuid: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  position: number;
  notes: string | null;
  client_uuid: string | null;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  session_exercise_id: string;
  set_number: number;
  set_type: SetType;
  weight: number | null;
  reps: number | null;
  duration_seconds: number | null;
  distance: number | null;
  rpe: number | null;
  is_completed: boolean;
  completed_at: string | null;
  client_uuid: string | null;
  created_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  pr_type: PrType;
  value: number;
  reps: number | null;
  weight: number | null;
  achieved_at: string;
  workout_set_id: string | null;
  created_at: string;
}

// --- Body, nutrition, activity ---------------------------------------------

export interface BodyMeasurement {
  id: string;
  user_id: string;
  recorded_at: string;
  body_fat_pct: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arms_cm: number | null;
  thighs_cm: number | null;
  hips_cm: number | null;
  neck_cm: number | null;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  recorded_at: string;
  source: string; // free text, default 'manual'
  created_at: string;
}

export interface NutritionGoal {
  user_id: string;
  mode: NutritionGoalMode | null;
  calorie_goal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  water_ml_goal: number | null;
  is_estimated: boolean;
  updated_at: string;
}

export interface Food {
  id: string;
  name: string;
  brand: string | null;
  serving_size: number | null;
  serving_unit: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  external_provider: string | null;
  external_id: string | null;
  created_by: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  log_date: string;
  meal_type: MealType;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  meal_id: string;
  food_id: string | null;
  food_name: string | null;
  quantity: number;
  serving: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  logged_at: string;
  created_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
  created_at: string;
}

export interface DailyActivity {
  id: string;
  user_id: string;
  activity_date: string;
  steps: number | null;
  active_calories: number | null;
  distance_m: number | null;
  active_minutes: number | null;
  source: string; // free text, default 'manual'
  created_at: string;
  updated_at: string;
}

// --- Subscriptions, devices, health, analytics, audit ----------------------

export interface Subscription {
  id: string;
  user_id: string;
  provider: SubscriptionProvider;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  workout_reminders: boolean;
  rest_timer: boolean;
  streak_reminders: boolean;
  weekly_summary: boolean;
  goal_milestones: boolean;
  program_reminders: boolean;
  updated_at: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: string; // CHECK in ('ios','android')
  created_at: string;
  last_seen_at: string;
}

export interface HealthConnection {
  id: string;
  user_id: string;
  provider: HealthProvider;
  is_enabled: boolean;
  scopes: string[];
  last_synced_at: string | null;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event: string;
  properties: Json;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_user_id: string | null; // on delete set null — audit row survives actor deletion (§90)
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Json;
  created_at: string;
}
