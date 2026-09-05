/**
 * Body & Measurements — §20: weight, body fat, measurements.
 * Redesigned with muscle map visualization and stats summary.
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { MuscleMap, type MuscleActivation } from '@/components/muscle-map';
import { StatsSummary } from '@/components/stats-summary';
import { LevelBadge } from '@/components/level-badge';
import { TimePeriodSelector, type TimePeriod } from '@/components/time-period-selector';
import { useWorkoutHistory } from '@/stores/workout-history';

// Mock muscle data - in real app, computed from workout history
const MOCK_MUSCLES: MuscleActivation[] = [
  { group: 'chest', level: 'gold' },
  { group: 'shoulders', level: 'bronze' },
  { group: 'biceps', level: 'bronze' },
  { group: 'back', level: 'gold' },
  { group: 'lats', level: 'bronze' },
  { group: 'core', level: 'wood' },
  { group: 'quads', level: 'gold' },
  { group: 'hamstrings', level: 'bronze' },
  { group: 'glutes', level: 'wood' },
  { group: 'calves', level: 'wood' },
  { group: 'traps', level: 'bronze' },
  { group: 'triceps', level: 'gold' },
  { group: 'rear_delts', level: 'wood' },
  { group: 'forearms', level: 'none' },
];

export default function BodyMeasurementsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [period, setPeriod] = useState<TimePeriod>('month');
  const { getWorkoutCount, getWeeklyStats } = useWorkoutHistory();

  const weeklyStats = getWeeklyStats(4);
  const totalWorkouts = getWorkoutCount();
  const totalTime = weeklyStats.reduce((sum, w) => sum + w.totalDuration, 0) / 60;
  const totalWeight = weeklyStats.reduce((sum, w) => sum + w.totalVolume, 0);

  // Count muscle levels
  const goldCount = MOCK_MUSCLES.filter((m) => m.level === 'gold').length;
  const bronzeCount = MOCK_MUSCLES.filter((m) => m.level === 'bronze').length;
  const woodCount = MOCK_MUSCLES.filter((m) => m.level === 'wood').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.title}>BODY MAP</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Time Period Selector */}
        <TimePeriodSelector selected={period} onSelect={setPeriod} />

        {/* Stats Summary */}
        <StatsSummary
          workouts={totalWorkouts}
          timeMinutes={Math.round(totalTime)}
          totalWeightKg={Math.round(totalWeight)}
        />

        {/* Level Section */}
        <View style={[styles.levelCard, { backgroundColor: colors.card }]}>
          <View style={styles.levelHeader}>
            <View>
              <ThemedText type="small" themeColor="textMuted">YOUR LEVEL</ThemedText>
              <ThemedText type="h2" style={{ color: '#CD7F32' }}>Bronze</ThemedText>
            </View>
            <TouchableOpacity style={styles.compareBtn}>
              <ThemedText type="small" themeColor="primary">Compare</ThemedText>
              <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Muscle Map */}
          <MuscleMap muscles={MOCK_MUSCLES} />

          {/* Level Badge */}
          <LevelBadge gold={goldCount} bronze={bronzeCount} wood={woodCount} />
        </View>
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    letterSpacing: 2,
  },
  levelCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
  },
});
