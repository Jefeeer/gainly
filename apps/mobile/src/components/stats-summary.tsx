/**
 * StatsSummary — Compact stat cards showing key metrics.
 * Used in the body map screen to show workouts, time, and total weight.
 */

import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type StatsSummaryProps = {
  workouts: number;
  timeMinutes: number;
  totalWeightKg: number;
};

export function StatsSummary({ workouts, timeMinutes, totalWeightKg }: StatsSummaryProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      {/* Top row - Workouts & Time */}
      <View style={styles.topRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' + '20' }]}>
            <Ionicons name="fitness" size={20} color="#3B82F6" />
          </View>
          <View style={styles.statInfo}>
            <ThemedText type="small" themeColor="textMuted">Workouts</ThemedText>
            <ThemedText type="h1" style={{ color: colors.primary }}>{workouts}</ThemedText>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' + '20' }]}>
            <Ionicons name="time" size={20} color="#3B82F6" />
          </View>
          <View style={styles.statInfo}>
            <ThemedText type="small" themeColor="textMuted">Time</ThemedText>
            <ThemedText type="h1" style={{ color: colors.text }}>{timeMinutes} min</ThemedText>
          </View>
        </View>
      </View>

      {/* Bottom row - Total Weight */}
      <View style={[styles.weightCard, { backgroundColor: colors.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' + '20' }]}>
          <Ionicons name="barbell" size={20} color="#3B82F6" />
        </View>
        <View style={styles.weightInfo}>
          <ThemedText type="small" themeColor="textMuted">Total Weight</ThemedText>
          <ThemedText type="hero" style={{ color: colors.text }}>
            {totalWeightKg.toLocaleString()} kg
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
    gap: 2,
  },
  weightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  weightInfo: {
    flex: 1,
    gap: 2,
  },
});
