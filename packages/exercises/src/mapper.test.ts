import { describe, expect, it } from 'vitest';

import {
  LOSSY_EQUIPMENT,
  LOSSY_MUSCLES,
  generateSlug,
  mapEquipment,
  mapExerciseType,
  mapMuscleGroup,
  normalizeSearchText,
} from './mapper';

describe('mapMuscleGroup', () => {
  it('maps direct 1:1 muscles correctly', () => {
    expect(mapMuscleGroup('Chest').muscle).toBe('Chest');
    expect(mapMuscleGroup('Back').muscle).toBe('Back');
    expect(mapMuscleGroup('Biceps').muscle).toBe('Biceps');
    expect(mapMuscleGroup('Triceps').muscle).toBe('Triceps');
    expect(mapMuscleGroup('Hamstrings').muscle).toBe('Hamstrings');
    expect(mapMuscleGroup('Glutes').muscle).toBe('Glutes');
  });

  it('renames WG names to Gainly canonical', () => {
    expect(mapMuscleGroup('Quads').muscle).toBe('Quadriceps');
    expect(mapMuscleGroup('Core').muscle).toBe('Abdominals');
  });

  it('folds lossy muscles with warnings', () => {
    const lats = mapMuscleGroup('Lats');
    expect(lats.muscle).toBe('Back');
    expect(lats.warning).toContain('Lossy');

    const rearDelts = mapMuscleGroup('Rear Delts');
    expect(rearDelts.muscle).toBe('Shoulders');
    expect(rearDelts.warning).toContain('Lossy');

    const legs = mapMuscleGroup('Legs');
    expect(legs.muscle).toBe('Full Body');
    expect(legs.warning).toContain('Lossy');
  });

  it('maps unknown muscles to Other with warning', () => {
    const result = mapMuscleGroup('Unknown Muscle');
    expect(result.muscle).toBe('Other');
    expect(result.warning).toContain('Unknown');
  });

  it('all LOSSY_MUSCLES produce warnings', () => {
    for (const muscle of LOSSY_MUSCLES) {
      const result = mapMuscleGroup(muscle);
      expect(result.warning).toBeTruthy();
    }
  });
});

describe('mapEquipment', () => {
  it('maps direct 1:1 equipment correctly', () => {
    expect(mapEquipment('Barbell').equipment).toBe('Barbell');
    expect(mapEquipment('Dumbbell').equipment).toBe('Dumbbell');
    expect(mapEquipment('Machine').equipment).toBe('Machine');
    expect(mapEquipment('Cable').equipment).toBe('Cable');
    expect(mapEquipment('Bodyweight').equipment).toBe('Bodyweight');
    expect(mapEquipment('Kettlebell').equipment).toBe('Kettlebell');
    expect(mapEquipment('Resistance Band').equipment).toBe('Resistance Band');
  });

  it('renames Cardio to Cardio Machine with warning', () => {
    const result = mapEquipment('Cardio');
    expect(result.equipment).toBe('Cardio Machine');
    expect(result.warning).toContain('Cardio');
  });

  it('maps unsupported equipment to Other with warning', () => {
    const pullup = mapEquipment('Pull-up Bar');
    expect(pullup.equipment).toBe('Other');
    expect(pullup.warning).toContain('Unsupported');

    const wall = mapEquipment('Wall');
    expect(wall.equipment).toBe('Other');
    expect(wall.warning).toContain('Unsupported');
  });

  it('all LOSSY_EQUIPMENT produce warnings', () => {
    for (const equip of LOSSY_EQUIPMENT) {
      const result = mapEquipment(equip);
      expect(result.equipment).toBe('Other');
      expect(result.warning).toBeTruthy();
    }
  });
});

describe('mapExerciseType', () => {
  it('maps all 5 WG types correctly', () => {
    expect(mapExerciseType('weight_reps')).toBe('weight_reps');
    expect(mapExerciseType('bodyweight_reps')).toBe('bodyweight_reps');
    expect(mapExerciseType('duration')).toBe('duration');
    expect(mapExerciseType('distance_duration')).toBe('distance_duration');
    expect(mapExerciseType('assisted_bodyweight')).toBe('assisted_bodyweight');
  });

  it('returns null for unknown types', () => {
    expect(mapExerciseType('unknown')).toBeNull();
  });
});

describe('normalizeSearchText', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeSearchText('Púll-Up')).toBe('pull up');
  });

  it('converts & to "and"', () => {
    expect(normalizeSearchText('Chest & Back')).toBe('chest and back');
  });

  it('collapses whitespace', () => {
    expect(normalizeSearchText('  Bench   Press  ')).toBe('bench press');
  });

  it('handles empty string', () => {
    expect(normalizeSearchText('')).toBe('');
  });

  it('matches WG normalizeSearchText behavior', () => {
    // From exercise-mapping.md §5: "  Púll-Up BAR  " → "pull up bar"
    expect(normalizeSearchText('  Púll-Up BAR  ')).toBe('pull up bar');
  });
});

describe('generateSlug', () => {
  it('generates hyphenated slugs from names', () => {
    expect(generateSlug('Bench Press')).toBe('bench-press');
    expect(generateSlug('Romanian Deadlift')).toBe('romanian-deadlift');
  });

  it('normalizes before slugging', () => {
    expect(generateSlug('  Pull-Up  ')).toBe('pull-up');
  });
});
