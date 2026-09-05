/**
 * Nutrition store — §22-§25: calories, macros, meals, food logging, water.
 * §88: timestamps in UTC, display by local date.
 */

import { create } from 'zustand';
import { generateUUID } from '@/utils/uuid';

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
}

export interface FoodLogEntry {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodId: string | null;
  foodName: string;
  quantity: number;
  serving: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  loggedAt: string;
}

export interface WaterLogEntry {
  id: string;
  amountMl: number;
  loggedAt: string;
}

export interface NutritionGoal {
  mode: 'lose' | 'maintain' | 'gain' | null;
  calorieGoal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  waterMlGoal: number | null;
}

interface NutritionState {
  foodLogs: FoodLogEntry[];
  waterLogs: WaterLogEntry[];
  nutritionGoal: NutritionGoal;
  recentFoods: FoodItem[];
}

interface NutritionActions {
  logFood: (entry: Omit<FoodLogEntry, 'id' | 'loggedAt'>) => void;
  removeFoodLog: (id: string) => void;
  logWater: (amountMl: number) => void;
  removeWaterLog: (id: string) => void;
  setNutritionGoal: (goal: Partial<NutritionGoal>) => void;
  addRecentFood: (food: FoodItem) => void;
  getDailyLogs: (date?: Date) => FoodLogEntry[];
  getDailyWater: (date?: Date) => WaterLogEntry[];
  getDailyTotals: (date?: Date) => { calories: number; proteinG: number; carbsG: number; fatG: number; waterMl: number };
}

function toLocalDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export const useNutrition = create<NutritionState & NutritionActions>((set, get) => ({
  foodLogs: [],
  waterLogs: [],
  nutritionGoal: { mode: null, calorieGoal: null, proteinG: null, carbsG: null, fatG: null, fiberG: null, waterMlGoal: null },
  recentFoods: [],

  logFood: (entry) => {
    set((s) => ({
      foodLogs: [
        { ...entry, id: generateUUID(), loggedAt: new Date().toISOString() },
        ...s.foodLogs,
      ],
    }));
  },

  removeFoodLog: (id) => {
    set((s) => ({ foodLogs: s.foodLogs.filter((f) => f.id !== id) }));
  },

  logWater: (amountMl) => {
    set((s) => ({
      waterLogs: [
        { id: generateUUID(), amountMl, loggedAt: new Date().toISOString() },
        ...s.waterLogs,
      ],
    }));
  },

  removeWaterLog: (id) => {
    set((s) => ({ waterLogs: s.waterLogs.filter((w) => w.id !== id) }));
  },

  setNutritionGoal: (goal) => {
    set((s) => ({ nutritionGoal: { ...s.nutritionGoal, ...goal } }));
  },

  addRecentFood: (food) => {
    set((s) => ({
      recentFoods: [food, ...s.recentFoods.filter((f) => f.id !== food.id)].slice(0, 20),
    }));
  },

  getDailyLogs: (date) => {
    const target = toLocalDate(date);
    return get().foodLogs.filter((f) => toLocalDate(new Date(f.loggedAt)) === target);
  },

  getDailyWater: (date) => {
    const target = toLocalDate(date);
    return get().waterLogs.filter((w) => toLocalDate(new Date(w.loggedAt)) === target);
  },

  getDailyTotals: (date) => {
    const logs = get().getDailyLogs(date);
    const water = get().getDailyWater(date);
    return {
      calories: logs.reduce((s, l) => s + (l.calories ?? 0), 0),
      proteinG: logs.reduce((s, l) => s + (l.proteinG ?? 0), 0),
      carbsG: logs.reduce((s, l) => s + (l.carbsG ?? 0), 0),
      fatG: logs.reduce((s, l) => s + (l.fatG ?? 0), 0),
      waterMl: water.reduce((s, w) => s + w.amountMl, 0),
    };
  },
}));
