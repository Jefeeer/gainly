/**
 * Nutrition Day — §22-§23: day totals, meals, quick actions.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { MetricCard } from '@/components/metric-card';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNutrition, type FoodLogEntry } from '@/stores/nutrition';

const MEALS: { type: FoodLogEntry['mealType']; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'snack', label: 'Snacks' },
];

const QUICK_FOODS = [
  { name: 'Chicken Breast', calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { name: 'Rice (1 cup)', calories: 206, proteinG: 4.3, carbsG: 45, fatG: 0.4 },
  { name: 'Banana', calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4 },
  { name: 'Egg', calories: 78, proteinG: 6, carbsG: 0.6, fatG: 5 },
];

export default function NutritionDayScreen() {
  const theme = useTheme();
  const { logFood, logWater, getDailyTotals, nutritionGoal } = useNutrition();
  const [showLogFood, setShowLogFood] = useState(false);
  const [foodInput, setFoodInput] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [mealType, setMealType] = useState<FoodLogEntry['mealType']>('lunch');

  const totals = getDailyTotals();
  const calGoal = nutritionGoal.calorieGoal;
  const remaining = calGoal ? calGoal - totals.calories : null;

  function handleLogFood(name: string, calories: number, proteinG?: number, carbsG?: number, fatG?: number) {
    logFood({ mealType, foodId: null, foodName: name, quantity: 1, serving: null, calories, proteinG: proteinG ?? null, carbsG: carbsG ?? null, fatG: fatG ?? null, fiberG: null });
    setShowLogFood(false);
    setFoodInput({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  }

  return (
    <Screen>
      <ThemedText type="h1">Nutrition</ThemedText>

      {/* Daily totals */}
      <View style={styles.statsRow}>
        <MetricCard
          value={`${totals.calories}`}
          label={`k${remaining != null ? `/${calGoal}` : ''} cal`}
          trend={remaining != null ? { direction: remaining >= 0 ? 'up' : 'down', value: `${remaining} left` } : undefined}
        />
        <MetricCard value={`${totals.proteinG}g`} label="Protein" />
      </View>

      {calGoal ? <ProgressBar value={Math.min(1, totals.calories / calGoal)} label="Calories" /> : null}

      {/* Quick water */}
      <Card>
        <View style={styles.waterRow}>
          <ThemedText type="h3">Water: {totals.waterMl} ml</ThemedText>
          <View style={styles.waterButtons}>
            {[250, 500, 750].map((amt) => (
              <Button key={amt} label={`+${amt}`} size="sm" variant="secondary" onPress={() => logWater(amt)} />
            ))}
          </View>
        </View>
      </Card>

      {/* Meals */}
      {MEALS.map(({ type, label }) => {
        const mealLogs = useNutrition.getState().getDailyLogs().filter((l) => l.mealType === type);
        const mealCal = mealLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
        return (
          <Card key={type}>
            <View style={styles.mealHeader}>
              <ThemedText type="h3">{label}</ThemedText>
              <ThemedText type="small" themeColor="textMuted">{mealCal} cal</ThemedText>
            </View>
            {mealLogs.length === 0 ? (
              <ThemedText type="small" themeColor="textMuted">No foods logged</ThemedText>
            ) : (
              mealLogs.slice(0, 3).map((log) => (
                <View key={log.id} style={styles.foodRow}>
                  <ThemedText type="default">{log.foodName}</ThemedText>
                  <ThemedText type="small" themeColor="textMuted">{log.calories ?? 0} cal</ThemedText>
                </View>
              ))
            )}
          </Card>
        );
      })}

      {/* Log food */}
      <Card>
        <Pressable onPress={() => setShowLogFood(!showLogFood)}>
          <ThemedText type="h3">+ Log Food</ThemedText>
        </Pressable>
        {showLogFood ? (
          <View style={styles.logForm}>
            <View style={styles.mealTypeRow}>
              {MEALS.map(({ type, label }) => (
                <Pressable key={type} onPress={() => setMealType(type)} style={[styles.mealTypeChip, { backgroundColor: mealType === type ? theme.primary : theme.backgroundElement }]}>
                  <ThemedText type="small" themeColor={mealType === type ? 'onPrimary' : 'textSecondary'}>{label}</ThemedText>
                </Pressable>
              ))}
            </View>
            <TextField label="Food" placeholder="e.g. Chicken Breast" value={foodInput.name} onChangeText={(v) => setFoodInput((p) => ({ ...p, name: v }))} />
            <TextField label="Calories" placeholder="165" keyboardType="numeric" value={foodInput.calories} onChangeText={(v) => setFoodInput((p) => ({ ...p, calories: v }))} />
            <View style={styles.quickFoods}>
              {QUICK_FOODS.map((f) => (
                <Pressable key={f.name} onPress={() => handleLogFood(f.name, f.calories, f.proteinG, f.carbsG, f.fatG)} style={[styles.quickFoodChip, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="small">{f.name}</ThemedText>
                </Pressable>
              ))}
            </View>
            <Button label="Add" size="sm" onPress={() => handleLogFood(foodInput.name || 'Custom Food', parseInt(foodInput.calories) || 0)} />
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  waterRow: { gap: Spacing.two },
  waterButtons: { flexDirection: 'row', gap: Spacing.two },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.one },
  logForm: { gap: Spacing.three, marginTop: Spacing.three },
  mealTypeRow: { flexDirection: 'row', gap: Spacing.two },
  mealTypeChip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Spacing.two },
  quickFoods: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  quickFoodChip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Spacing.two },
});
