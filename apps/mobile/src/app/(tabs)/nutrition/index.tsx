/**
 * Nutrition Day — Dark premium design with progress rings and neon accents.
 */

import { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useNutrition, type FoodLogEntry } from '@/stores/nutrition';

const MEALS: { type: FoodLogEntry['mealType']; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: 'sunny', color: '#FFB800' },
  { type: 'lunch', label: 'Lunch', icon: 'restaurant', color: '#C8FF00' },
  { type: 'dinner', label: 'Dinner', icon: 'moon', color: '#00F0FF' },
  { type: 'snack', label: 'Snacks', icon: 'fitness', color: '#FF6B6B' },
];

export default function NutritionDayScreen() {
  const colors = useTheme();
  const { logFood, logWater, getDailyTotals, nutritionGoal } = useNutrition();
  const totals = getDailyTotals();
  const calGoal = nutritionGoal.calorieGoal;
  const remaining = calGoal ? calGoal - totals.calories : null;
  const progress = calGoal ? Math.min(1, totals.calories / calGoal) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="h1" style={styles.title}>NUTRITION</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Track your macros</ThemedText>
          </View>
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Calorie Ring */}
        <View style={[styles.calorieCard, { backgroundColor: colors.card }]}>
          <View style={styles.ringContainer}>
            {/* Outer ring */}
            <View style={[styles.ringOuter, { borderColor: colors.border }]}>
              {/* Progress ring simulation */}
              <View style={[styles.ringInner, { borderColor: colors.primary }]}>
                <ThemedText type="hero" style={{ color: colors.primary }}>{totals.calories}</ThemedText>
                <ThemedText type="small" themeColor="textMuted">of {calGoal ?? '—'}</ThemedText>
                {remaining != null && (
                  <ThemedText type="small" style={{ color: remaining >= 0 ? '#C8FF00' : '#FF4757' }}>
                    {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Macro Cards */}
        <View style={styles.macroRow}>
          <View style={[styles.macroCard, { backgroundColor: colors.card }]}>
            <View style={[styles.macroIcon, { backgroundColor: '#FF6B6B' + '20' }]}>
              <Ionicons name="flash" size={20} color="#FF6B6B" />
            </View>
            <ThemedText type="h2" style={{ color: '#FF6B6B' }}>{totals.proteinG}g</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Protein</ThemedText>
          </View>
          
          <View style={[styles.macroCard, { backgroundColor: colors.card }]}>
            <View style={[styles.macroIcon, { backgroundColor: '#FFB800' + '20' }]}>
              <Ionicons name="flash" size={20} color="#FFB800" />
            </View>
            <ThemedText type="h2" style={{ color: '#FFB800' }}>{totals.carbsG}g</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Carbs</ThemedText>
          </View>
          
          <View style={[styles.macroCard, { backgroundColor: colors.card }]}>
            <View style={[styles.macroIcon, { backgroundColor: '#00F0FF' + '20' }]}>
              <Ionicons name="flash" size={20} color="#00F0FF" />
            </View>
            <ThemedText type="h2" style={{ color: '#00F0FF' }}>{totals.fatG}g</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Fat</ThemedText>
          </View>
        </View>

        {/* Water Tracker */}
        <View style={[styles.waterCard, { backgroundColor: colors.card }]}>
          <View style={styles.waterHeader}>
            <View style={styles.waterTitle}>
              <Ionicons name="water" size={20} color="#00F0FF" />
              <ThemedText type="h3"> WATER</ThemedText>
            </View>
            <ThemedText type="h3" style={{ color: '#00F0FF' }}>{totals.waterMl} ml</ThemedText>
          </View>
          <View style={styles.waterButtons}>
            {[250, 500, 750].map((amt) => (
              <TouchableOpacity 
                key={amt}
                style={[styles.waterBtn, { backgroundColor: '#00F0FF' + '15' }]}
                onPress={() => logWater(amt)}
              >
                <ThemedText type="smallBold" style={{ color: '#00F0FF' }}>+{amt}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Meals */}
        <View style={styles.mealsSection}>
          <ThemedText type="h3" style={styles.sectionTitle}>MEALS</ThemedText>
          
          {MEALS.map(({ type, label, icon, color }) => {
            const mealLogs = useNutrition.getState().getDailyLogs().filter((l) => l.mealType === type);
            const mealCal = mealLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
            return (
              <TouchableOpacity key={type} style={[styles.mealCard, { backgroundColor: colors.card }]}>
                <View style={[styles.mealIcon, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={styles.mealInfo}>
                  <View style={styles.mealTitleRow}>
                    <ThemedText type="defaultBold">{label}</ThemedText>
                    <ThemedText type="h3" style={{ color }}>{mealCal}</ThemedText>
                  </View>
                  {mealLogs.length === 0 ? (
                    <ThemedText type="small" themeColor="textMuted">No foods logged</ThemedText>
                  ) : (
                    <ThemedText type="small" themeColor="textMuted">
                      {mealLogs.length} item{mealLogs.length !== 1 ? 's' : ''} · {mealCal} cal
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
          <Ionicons name="add-circle" size={20} color={colors.onPrimary} />
          <ThemedText type="defaultBold" style={{ color: colors.onPrimary }}>LOG FOOD</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    letterSpacing: 2,
    fontSize: 28,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieCard: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
  },
  ringContainer: {
    alignItems: 'center',
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  macroCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  macroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  waterCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  mealsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    letterSpacing: 1,
    marginBottom: 16,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  mealIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    padding: 18,
    borderRadius: 16,
    gap: 8,
    marginBottom: 32,
  },
});
