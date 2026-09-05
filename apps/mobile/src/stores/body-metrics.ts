/**
 * Body metrics store — §20: weight, body fat, measurements.
 * Tracks weight_logs and body_measurements.
 */

import { create } from 'zustand';
import { generateUUID } from '@/utils/uuid';

export interface WeightLog {
  id: string;
  weightKg: number;
  recordedAt: string;
  source: string;
}

export interface BodyMeasurement {
  id: string;
  recordedAt: string;
  bodyFatPct: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armsCm: number | null;
  thighsCm: number | null;
  hipsCm: number | null;
  neckCm: number | null;
}

export interface UserGoal {
  id: string;
  title: string;
  goalType: string;
  exerciseId: string | null;
  startingValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  targetDate: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface BodyMetricsState {
  weightLogs: WeightLog[];
  measurements: BodyMeasurement[];
  goals: UserGoal[];
}

interface BodyMetricsActions {
  logWeight: (weightKg: number) => void;
  logMeasurement: (data: Partial<Omit<BodyMeasurement, 'id' | 'recordedAt'>>) => void;
  getWeightHistory: (days?: number) => WeightLog[];
  getLatestWeight: () => WeightLog | null;
  getMeasurementHistory: (days?: number) => BodyMeasurement[];
  createGoal: (goal: Omit<UserGoal, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'completedAt'>) => void;
  updateGoalProgress: (id: string, currentValue: number) => void;
  completeGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  getActiveGoals: () => UserGoal[];
}

export const useBodyMetrics = create<BodyMetricsState & BodyMetricsActions>((set, get) => ({
  weightLogs: [],
  measurements: [],
  goals: [],

  logWeight: (weightKg) => {
    set((s) => ({
      weightLogs: [
        { id: generateUUID(), weightKg, recordedAt: new Date().toISOString(), source: 'manual' },
        ...s.weightLogs,
      ],
    }));
  },

  logMeasurement: (data) => {
    set((s) => ({
      measurements: [
        { id: generateUUID(), recordedAt: new Date().toISOString(), ...data } as BodyMeasurement,
        ...s.measurements,
      ],
    }));
  },

  getWeightHistory: (days = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return get().weightLogs.filter((w) => new Date(w.recordedAt) >= cutoff);
  },

  getLatestWeight: () => {
    const sorted = [...get().weightLogs].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
    return sorted[0] ?? null;
  },

  getMeasurementHistory: (days = 90) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return get().measurements.filter((m) => new Date(m.recordedAt) >= cutoff);
  },

  createGoal: (goal) => {
    const now = new Date().toISOString();
    set((s) => ({
      goals: [
        ...s.goals,
        {
          ...goal,
          id: generateUUID(),
          status: 'active',
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        },
      ],
    }));
  },

  updateGoalProgress: (id, currentValue) => {
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, currentValue, updatedAt: new Date().toISOString() } : g,
      ),
    }));
  },

  completeGoal: (id) => {
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id
          ? { ...g, status: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : g,
      ),
    }));
  },

  deleteGoal: (id) => {
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },

  getActiveGoals: () => get().goals.filter((g) => g.status === 'active'),
}));
