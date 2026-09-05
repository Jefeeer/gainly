import { describe, expect, it } from 'vitest';

import {
  CreateExerciseSchema,
  CreateGoalSchema,
  CreateTemplateSchema,
  ExerciseSearchSchema,
  FinishWorkoutSchema,
  LogFoodSchema,
  LogMeasurementSchema,
  LogWaterSchema,
  LogWeightSchema,
  NutritionGoalSchema,
  ProfileUpdateSchema,
  StartWorkoutSchema,
  TemplateExerciseSchema,
  UpdateGoalProgressSchema,
  UserSettingsSchema,
  WorkoutSetInputSchema,
} from './schemas';

describe('ProfileUpdateSchema', () => {
  it('accepts valid minimal profile update', () => {
    const result = ProfileUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a full valid profile', () => {
    const result = ProfileUpdateSchema.safeParse({
      username: 'mark_lifts',
      display_name: 'Mark',
      date_of_birth: '1990-05-15',
      biological_sex: 'male',
      height_cm: 180,
      fitness_goal: 'build_muscle',
      experience_level: 'intermediate',
      measurement_system: 'metric',
      training_days_per_week: 4,
    });
    expect(result.success).toBe(true);
  });

  it('rejects username with invalid characters', () => {
    const result = ProfileUpdateSchema.safeParse({ username: 'mark lifts!' });
    expect(result.success).toBe(false);
  });

  it('rejects username shorter than 3 chars', () => {
    const result = ProfileUpdateSchema.safeParse({ username: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = ProfileUpdateSchema.safeParse({ date_of_birth: '05/15/1990' });
    expect(result.success).toBe(false);
  });

  it('rejects height outside valid range', () => {
    const result = ProfileUpdateSchema.safeParse({ height_cm: 400 });
    expect(result.success).toBe(false);
  });

  it('rejects training_days_per_week outside 1-7', () => {
    const result = ProfileUpdateSchema.safeParse({ training_days_per_week: 8 });
    expect(result.success).toBe(false);
  });
});

describe('WorkoutSetInputSchema', () => {
  it('accepts a minimal set with only set_number', () => {
    const result = WorkoutSetInputSchema.safeParse({ set_number: 1 });
    expect(result.success).toBe(true);
  });

  it('defaults set_type to normal', () => {
    const result = WorkoutSetInputSchema.parse({ set_number: 1 });
    expect(result.set_type).toBe('normal');
  });

  it('defaults is_completed to false', () => {
    const result = WorkoutSetInputSchema.parse({ set_number: 1 });
    expect(result.is_completed).toBe(false);
  });

  it('rejects negative weight', () => {
    const result = WorkoutSetInputSchema.safeParse({ set_number: 1, weight: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects negative reps', () => {
    const result = WorkoutSetInputSchema.safeParse({ set_number: 1, reps: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects RPE above 10', () => {
    const result = WorkoutSetInputSchema.safeParse({ set_number: 1, rpe: 11 });
    expect(result.success).toBe(false);
  });

  it('accepts a complete set', () => {
    const result = WorkoutSetInputSchema.safeParse({
      set_number: 3,
      set_type: 'normal',
      weight: 100,
      reps: 8,
      rpe: 7,
      is_completed: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('StartWorkoutSchema', () => {
  it('accepts empty input (start empty workout)', () => {
    const result = StartWorkoutSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts workout with name', () => {
    const result = StartWorkoutSchema.safeParse({ name: 'Push Day' });
    expect(result.success).toBe(true);
  });
});

describe('FinishWorkoutSchema', () => {
  it('accepts empty input', () => {
    const result = FinishWorkoutSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts notes', () => {
    const result = FinishWorkoutSchema.safeParse({ notes: 'Great session!' });
    expect(result.success).toBe(true);
  });

  it('rejects notes exceeding max length', () => {
    const result = FinishWorkoutSchema.safeParse({ notes: 'x'.repeat(1001) });
    expect(result.success).toBe(false);
  });
});

describe('CreateExerciseSchema', () => {
  it('requires name and exercise_type', () => {
    const result = CreateExerciseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('requires at least one muscle', () => {
    const result = CreateExerciseSchema.safeParse({
      name: 'My Exercise',
      exercise_type: 'weight_reps',
      muscle_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a complete custom exercise', () => {
    const result = CreateExerciseSchema.safeParse({
      name: 'Cable Fly',
      exercise_type: 'weight_reps',
      muscle_ids: ['chest-uuid'],
      difficulty: 'beginner',
    });
    expect(result.success).toBe(true);
  });
});

describe('ExerciseSearchSchema', () => {
  it('accepts empty search (browse all)', () => {
    const result = ExerciseSearchSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a text query', () => {
    const result = ExerciseSearchSchema.safeParse({ query: 'bench press' });
    expect(result.success).toBe(true);
  });

  it('rejects query exceeding max length', () => {
    const result = ExerciseSearchSchema.safeParse({ query: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('CreateTemplateSchema', () => {
  it('requires name', () => {
    const result = CreateTemplateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('defaults visibility to private', () => {
    const result = CreateTemplateSchema.parse({ name: 'Push Day' });
    expect(result.visibility).toBe('private');
  });
});

describe('TemplateExerciseSchema', () => {
  it('requires exercise_id and position', () => {
    const result = TemplateExerciseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts a complete template exercise', () => {
    const result = TemplateExerciseSchema.safeParse({
      exercise_id: 'bench-press-uuid',
      position: 0,
      suggested_sets: 4,
      suggested_reps: 8,
      rest_seconds: 90,
    });
    expect(result.success).toBe(true);
  });
});

describe('NutritionGoalSchema', () => {
  it('accepts empty input', () => {
    const result = NutritionGoalSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a complete nutrition goal', () => {
    const result = NutritionGoalSchema.safeParse({
      mode: 'lose',
      calorie_goal: 2000,
      protein_g: 180,
      carbs_g: 200,
      fat_g: 70,
    });
    expect(result.success).toBe(true);
  });

  it('rejects calorie goal above 10000', () => {
    const result = NutritionGoalSchema.safeParse({ calorie_goal: 10001 });
    expect(result.success).toBe(false);
  });
});

describe('LogFoodSchema', () => {
  it('requires meal_type', () => {
    const result = LogFoodSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('defaults quantity to 1', () => {
    const result = LogFoodSchema.parse({ meal_type: 'lunch' });
    expect(result.quantity).toBe(1);
  });

  it('accepts a complete food log', () => {
    const result = LogFoodSchema.safeParse({
      meal_type: 'dinner',
      food_name: 'Chicken Breast',
      quantity: 2,
      calories: 330,
      protein_g: 62,
      carbs_g: 0,
      fat_g: 7,
    });
    expect(result.success).toBe(true);
  });
});

describe('LogWaterSchema', () => {
  it('requires amount_ml', () => {
    const result = LogWaterSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = LogWaterSchema.safeParse({ amount_ml: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts 250ml', () => {
    const result = LogWaterSchema.safeParse({ amount_ml: 250 });
    expect(result.success).toBe(true);
  });
});

describe('LogWeightSchema', () => {
  it('requires positive weight', () => {
    const result = LogWeightSchema.safeParse({ weight_kg: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts valid weight', () => {
    const result = LogWeightSchema.safeParse({ weight_kg: 82.5 });
    expect(result.success).toBe(true);
  });
});

describe('LogMeasurementSchema', () => {
  it('accepts empty input', () => {
    const result = LogMeasurementSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial measurements', () => {
    const result = LogMeasurementSchema.safeParse({ waist_cm: 80, chest_cm: 100 });
    expect(result.success).toBe(true);
  });

  it('rejects body fat above 100', () => {
    const result = LogMeasurementSchema.safeParse({ body_fat_pct: 101 });
    expect(result.success).toBe(false);
  });
});

describe('CreateGoalSchema', () => {
  it('requires title and goal_type', () => {
    const result = CreateGoalSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts a complete goal', () => {
    const result = CreateGoalSchema.safeParse({
      title: 'Bench 100kg',
      goal_type: 'lift',
      target_value: 100,
      unit: 'kg',
      target_date: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid target_date format', () => {
    const result = CreateGoalSchema.safeParse({
      title: 'Lose 10kg',
      goal_type: 'body_weight',
      target_date: '31-12-2026',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateGoalProgressSchema', () => {
  it('requires current_value', () => {
    const result = UpdateGoalProgressSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts status update', () => {
    const result = UpdateGoalProgressSchema.safeParse({
      current_value: 95,
      status: 'completed',
    });
    expect(result.success).toBe(true);
  });
});

describe('UserSettingsSchema', () => {
  it('accepts empty input', () => {
    const result = UserSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a complete settings update', () => {
    const result = UserSettingsSchema.safeParse({
      theme: 'dark',
      weight_unit: 'lb',
      default_rest_seconds: 120,
      auto_start_rest_timer: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid theme', () => {
    const result = UserSettingsSchema.safeParse({ theme: 'auto' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid weight unit', () => {
    const result = UserSettingsSchema.safeParse({ weight_unit: 'stones' });
    expect(result.success).toBe(false);
  });
});
