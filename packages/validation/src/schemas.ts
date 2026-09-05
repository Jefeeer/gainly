// @gainly/validation — shared Zod schemas for MVP entities.
// Encodes the shape from packages/types (hand-authored from frozen DDL) plus
// form-input constraints. Every schema is unit-tested vs fixtures.
// Extensionless re-export is deliberate (bundler/vitest resolution).

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum literals — match packages/types/src/enums.ts 1:1
// ---------------------------------------------------------------------------

export const MeasurementSystem = z.enum(['metric', 'imperial']);
export type MeasurementSystemValue = z.infer<typeof MeasurementSystem>;

export const ExperienceLevel = z.enum(['beginner', 'intermediate', 'advanced']);
export type ExperienceLevelValue = z.infer<typeof ExperienceLevel>;

export const FitnessGoal = z.enum([
  'build_muscle',
  'lose_weight',
  'get_stronger',
  'improve_fitness',
  'maintain_weight',
  'improve_endurance',
]);
export type FitnessGoalValue = z.infer<typeof FitnessGoal>;

export const BiologicalSex = z.enum(['male', 'female', 'unspecified']);
export type BiologicalSexValue = z.infer<typeof BiologicalSex>;

export const ExerciseType = z.enum([
  'weight_reps',
  'reps',
  'duration',
  'distance',
  'weight_duration',
  'distance_duration',
  'assisted_weight',
]);
export type ExerciseTypeValue = z.infer<typeof ExerciseType>;

export const SetType = z.enum(['warmup', 'normal', 'drop', 'failure', 'superset']);
export type SetTypeValue = z.infer<typeof SetType>;

export const DifficultyLevel = z.enum(['beginner', 'intermediate', 'advanced']);

export const ExerciseSource = z.enum(['gainly', 'workout_guide', 'user', 'admin', 'imported']);

export const GoalStatus = z.enum(['active', 'completed', 'paused', 'cancelled']);

export const PrType = z.enum([
  'max_weight',
  'max_e1rm',
  'max_reps',
  'max_volume',
  'best_distance',
  'best_duration',
]);

export const MealType = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const NutritionGoalMode = z.enum(['lose', 'maintain', 'gain']);

export const TemplateVisibility = z.enum(['private', 'public']);

export const ProgramStatus = z.enum(['draft', 'active', 'completed', 'archived']);

// ---------------------------------------------------------------------------
// UUID helper — non-empty string that looks like a UUID (loose validation;
// strict UUID parsing is the DB's job, not the schema's).
// ---------------------------------------------------------------------------

export const Uuid = z.string().min(1);

// ---------------------------------------------------------------------------
// Profile schemas
// ---------------------------------------------------------------------------

/** Create/update profile from onboarding or settings. */
export const ProfileUpdateSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores').optional(),
  display_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional().nullable(),
  biological_sex: BiologicalSex.optional(),
  height_cm: z.number().positive().max(300).optional().nullable(),
  fitness_goal: FitnessGoal.optional().nullable(),
  experience_level: ExperienceLevel.optional().nullable(),
  measurement_system: MeasurementSystem.optional(),
  training_days_per_week: z.number().int().min(1).max(7).optional().nullable(),
});
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

// ---------------------------------------------------------------------------
// Workout schemas
// ---------------------------------------------------------------------------

/** A single set in an active workout. */
export const WorkoutSetInputSchema = z.object({
  set_number: z.number().int().min(1),
  set_type: SetType.default('normal'),
  weight: z.number().min(0).optional().nullable(),
  reps: z.number().int().min(0).optional().nullable(),
  duration_seconds: z.number().min(0).optional().nullable(),
  distance: z.number().min(0).optional().nullable(),
  rpe: z.number().min(0).max(10).optional().nullable(),
  is_completed: z.boolean().default(false),
});
export type WorkoutSetInput = z.infer<typeof WorkoutSetInputSchema>;

/** Add an exercise to an active workout session. */
export const AddExerciseInputSchema = z.object({
  exercise_id: Uuid,
  position: z.number().int().min(0),
  notes: z.string().max(500).optional(),
});
export type AddExerciseInput = z.infer<typeof AddExerciseInputSchema>;

/** Start a new workout session. */
export const StartWorkoutSchema = z.object({
  name: z.string().max(100).optional(),
  template_id: Uuid.optional().nullable(),
  program_day_id: Uuid.optional().nullable(),
});
export type StartWorkoutInput = z.infer<typeof StartWorkoutSchema>;

/** Finish a workout session. */
export const FinishWorkoutSchema = z.object({
  notes: z.string().max(1000).optional(),
});
export type FinishWorkoutInput = z.infer<typeof FinishWorkoutSchema>;

// ---------------------------------------------------------------------------
// Exercise schemas
// ---------------------------------------------------------------------------

/** Create a custom exercise. */
export const CreateExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  instructions: z.string().max(2000).optional(),
  exercise_type: ExerciseType,
  equipment_id: Uuid.optional().nullable(),
  category_id: Uuid.optional().nullable(),
  difficulty: DifficultyLevel.optional().nullable(),
  muscle_ids: z.array(Uuid).min(1, 'At least one muscle group required'),
});
export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;

/** Exercise search/filter parameters. */
export const ExerciseSearchSchema = z.object({
  query: z.string().max(200).optional(),
  equipment: z.string().optional(),
  primaryMuscle: z.string().optional(),
  exerciseType: ExerciseType.optional(),
  isStretch: z.boolean().optional(),
});
export type ExerciseSearchParams = z.infer<typeof ExerciseSearchSchema>;

// ---------------------------------------------------------------------------
// Template schemas
// ---------------------------------------------------------------------------

/** Create a workout template. */
export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: TemplateVisibility.default('private'),
});
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;

/** Add an exercise to a template. */
export const TemplateExerciseSchema = z.object({
  exercise_id: Uuid,
  position: z.number().int().min(0),
  suggested_sets: z.number().int().min(1).max(20).optional().nullable(),
  suggested_reps: z.number().int().min(1).max(100).optional().nullable(),
  suggested_weight: z.number().min(0).optional().nullable(),
  rest_seconds: z.number().int().min(0).max(600).optional().nullable(),
  notes: z.string().max(500).optional(),
});
export type TemplateExerciseInput = z.infer<typeof TemplateExerciseSchema>;

// ---------------------------------------------------------------------------
// Nutrition schemas
// ---------------------------------------------------------------------------

/** Set nutrition goals. */
export const NutritionGoalSchema = z.object({
  mode: NutritionGoalMode.optional().nullable(),
  calorie_goal: z.number().int().min(0).max(10000).optional().nullable(),
  protein_g: z.number().int().min(0).max(500).optional().nullable(),
  carbs_g: z.number().int().min(0).max(1000).optional().nullable(),
  fat_g: z.number().int().min(0).max(500).optional().nullable(),
  fiber_g: z.number().int().min(0).max(200).optional().nullable(),
  water_ml_goal: z.number().int().min(0).max(20000).optional().nullable(),
});
export type NutritionGoalInput = z.infer<typeof NutritionGoalSchema>;

/** Log a food entry. */
export const LogFoodSchema = z.object({
  meal_type: MealType,
  food_id: Uuid.optional().nullable(),
  food_name: z.string().max(200).optional(),
  quantity: z.number().min(0).default(1),
  serving: z.string().max(50).optional(),
  calories: z.number().min(0).optional().nullable(),
  protein_g: z.number().min(0).optional().nullable(),
  carbs_g: z.number().min(0).optional().nullable(),
  fat_g: z.number().min(0).optional().nullable(),
  fiber_g: z.number().min(0).optional().nullable(),
});
export type LogFoodInput = z.infer<typeof LogFoodSchema>;

/** Log water intake. */
export const LogWaterSchema = z.object({
  amount_ml: z.number().int().min(1).max(10000),
});
export type LogWaterInput = z.infer<typeof LogWaterSchema>;

// ---------------------------------------------------------------------------
// Body metrics schemas
// ---------------------------------------------------------------------------

/** Log body weight. */
export const LogWeightSchema = z.object({
  weight_kg: z.number().positive().max(500),
});
export type LogWeightInput = z.infer<typeof LogWeightSchema>;

/** Log body measurements. */
export const LogMeasurementSchema = z.object({
  body_fat_pct: z.number().min(0).max(100).optional().nullable(),
  waist_cm: z.number().min(0).max(300).optional().nullable(),
  chest_cm: z.number().min(0).max(300).optional().nullable(),
  arms_cm: z.number().min(0).max(100).optional().nullable(),
  thighs_cm: z.number().min(0).max(200).optional().nullable(),
  hips_cm: z.number().min(0).max(300).optional().nullable(),
  neck_cm: z.number().min(0).max(100).optional().nullable(),
});
export type LogMeasurementInput = z.infer<typeof LogMeasurementSchema>;

// ---------------------------------------------------------------------------
// Goal schemas
// ---------------------------------------------------------------------------

/** Create a fitness goal. */
export const CreateGoalSchema = z.object({
  title: z.string().min(1).max(200),
  goal_type: z.string().min(1).max(50),
  exercise_id: Uuid.optional().nullable(),
  starting_value: z.number().optional().nullable(),
  target_value: z.number().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;

/** Update goal progress. */
export const UpdateGoalProgressSchema = z.object({
  current_value: z.number(),
  status: GoalStatus.optional(),
});
export type UpdateGoalProgressInput = z.infer<typeof UpdateGoalProgressSchema>;

// ---------------------------------------------------------------------------
// User settings schemas
// ---------------------------------------------------------------------------

/** Update user settings. */
export const UserSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).optional(),
  weight_unit: z.enum(['kg', 'lb']).optional(),
  distance_unit: z.enum(['km', 'miles']).optional(),
  measurement_unit: z.enum(['cm', 'inches']).optional(),
  volume_unit: z.enum(['ml', 'fl_oz']).optional(),
  default_rest_seconds: z.number().int().min(0).max(600).optional(),
  auto_start_rest_timer: z.boolean().optional(),
});
export type UserSettingsInput = z.infer<typeof UserSettingsSchema>;
