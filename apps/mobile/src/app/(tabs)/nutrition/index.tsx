/**
 * Nutrition Day — §22-§23: day totals, meals, quick actions.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useNutrition, type FoodLogEntry } from '@/stores/nutrition';

const MEALS: { type: FoodLogEntry['mealType']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: 'sunny' },
  { type: 'lunch', label: 'Lunch', icon: 'restaurant' },
  { type: 'dinner', label: 'Dinner', icon: 'moon' },
  { type: 'snack', label: 'Snacks', icon: 'fitness' },
];

export default function NutritionDayScreen() {
  const { colors } = useTheme();
  const { logFood, logWater, getDailyTotals, nutritionGoal } = useNutrition();
  const totals = getDailyTotals();
  const calGoal = nutritionGoal.calorieGoal;
  const remaining = calGoal ? calGoal - totals.calories : null;
  const progress = calGoal ? Math.min(1, totals.calories / calGoal) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="h1">Nutrition</ThemedText>
        <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Calorie Ring */}
      <View style={[styles.calorieCard, { backgroundColor: colors.primary + '10' }]}>
        <View style={styles.calorieRing}>
          <View style={[styles.ringOuter, { borderColor: colors.primary + '20' }]}>
            <View style={[styles.ringInner, { borderColor: colors.primary }]}>
              <ThemedText type="h1" style={{ color: colors.primary }}>{totals.calories}</ThemedText>
              <ThemedText type="small" themeColor="textMuted">of {calGoal ?? '—'}</ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.calorieStats}>
          <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
            <ThemedText type="h3" style={{ color: '#10B981' }}>{totals.proteinG}g</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Protein</ThemedText>
          </View>
          <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
            <ThemedText type="h3" style={{ color: '#F59E0B' }}>{totals.carbsG}g</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Carbs</ThemedText>
          </View>
          <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
            <ThemedText type="h3" style={{ color: '#EF4444' }}>{totals.fatG}g</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Fat</ThemedText>
          </View>
        </View>
      </View>

      {/* Water Tracker */}
      <View style={[styles.waterCard, { backgroundColor: colors.surface }]}>
        <View style={styles.waterHeader}>
          <View style={styles.waterTitle}>
            <Ionicons name="water" size={20} color="#3B82F6" />
            <ThemedText type="h3"> Water</ThemedText>
          </View>
          <ThemedText type="h3" style={{ color: '#3B82F6' }}>{totals.waterMl} ml</ThemedText>
        </View>
        <View style={styles.waterButtons}>
          {[250, 500, 750].map((amt) => (
            <TouchableOpacity 
              key={amt}
              style={[styles.waterBtn, { backgroundColor: '#3B82F6' + '15' }]}
              onPress={() => logWater(amt)}
            >
              <ThemedText type="smallBold" style={{ color: '#3B82F6' }}>+{amt}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Meals */}
      <View style={styles.mealsSection}>
        {MEALS.map(({ type, label, icon }) => {
          const mealLogs = useNutrition.getState().getDailyLogs().filter((l) => l.mealType === type);
          const mealCal = mealLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
          return (
            <TouchableOpacity key={type} style={[styles.mealCard, { backgroundColor: colors.surface }]}>
              <View style={styles.mealIcon}>
                <Ionicons name={icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.mealInfo}>
                <View style={styles.mealTitleRow}>
                  <ThemedText type="defaultBold">{label}</ThemedText>
                  <ThemedText type="small" themeColor="textMuted">{mealCal} cal</ThemedText>
                </View>
                {mealLogs.length === 0 ? (
                  <ThemedText type="small" themeColor="textMuted">No foods logged</ThemedText>
                ) : (
                  <ThemedText type="small" themeColor="textMuted">
                    {mealLogs.length} item{mealLogs.length !== 1 ? 's' : ''}
                  </ThemedText>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Add Food Button */}
      <TouchableOpacity style={[styles.addFoodBtn, { backgroundColor: colors.primary }]}>
        <Ionicons name="add-circle" size={20} color="#fff" />
        <ThemedText type="defaultBold" style={{ color: '#fff' }}>Log Food</ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  calorieRing: {
    marginBottom: 20,
  },
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieStats: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStat: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  waterCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  waterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  mealsSection: {
    gap: 12,
    marginBottom: 16,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981' + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
});
