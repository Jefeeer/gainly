/**
 * Workout Summary — §56, shown after completing a workout.
 * Duration, total volume, exercises, sets, repetitions, new PRs, muscles trained.
 */

import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { MetricCard } from '@/components/metric-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type WorkoutSummaryProps = {
  workoutName?: string;
  duration?: string;
  totalVolume?: number;
  totalSets?: number;
  completedSets?: number;
  totalReps?: number;
  exercises?: number;
  newPRs?: string[];
  musclesTrained?: string[];
};

export default function WorkoutSummary({
  workoutName = 'Workout',
  duration = '0:00',
  totalVolume = 0,
  totalSets = 0,
  completedSets = 0,
  totalReps = 0,
  exercises = 0,
  newPRs = [],
  musclesTrained = [],
}: WorkoutSummaryProps) {
  return (
    <Screen>
      <ThemedText type="h1" style={styles.title}>
        Workout Complete!
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
        {workoutName}
      </ThemedText>

      {/* Metrics grid */}
      <View style={styles.metricsGrid}>
        <MetricCard value={duration} label="Duration" />
        <MetricCard
          value={`${totalVolume.toLocaleString()} kg`}
          label="Total Volume"
        />
        <MetricCard value={`${completedSets}/${totalSets}`} label="Sets" />
        <MetricCard value={totalReps.toString()} label="Reps" />
      </View>

      {/* Exercises completed */}
      <Card>
        <ThemedText type="h3" style={styles.sectionTitle}>
          {exercises} Exercise{exercises !== 1 ? 's' : ''} Completed
        </ThemedText>
      </Card>

      {/* New PRs */}
      {newPRs.length > 0 ? (
        <Card>
          <ThemedText type="h3" style={styles.sectionTitle}>
            🎉 New Personal Records!
          </ThemedText>
          {newPRs.map((pr, i) => (
            <ThemedText key={i} type="default" themeColor="primary">
              {pr}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      {/* Muscles trained */}
      {musclesTrained.length > 0 ? (
        <Card>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Muscles Trained
          </ThemedText>
          <View style={styles.tagRow}>
            {musclesTrained.map((muscle) => (
              <View key={muscle} style={[styles.tag, { backgroundColor: '#EAF9EF' }]}>
                <ThemedText type="small" themeColor="primary">{muscle}</ThemedText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {/* Actions */}
      <Button label="Done" href="/(tabs)" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  metricsGrid: {
    gap: Spacing.two,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
});
