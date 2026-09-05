/**
 * Workout History — §9: view workout history.
 * Shows completed workouts with date, duration, volume, exercises.
 */

import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useWorkoutHistory, type CompletedWorkout } from '@/stores/workout-history';

export default function WorkoutHistoryScreen() {
  const { getHistory } = useWorkoutHistory();
  const history = getHistory();

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, CompletedWorkout[]>();
    for (const w of history) {
      const date = new Date(w.startedAt).toLocaleDateString();
      const existing = map.get(date) ?? [];
      existing.push(w);
      map.set(date, existing);
    }
    return [...map.entries()];
  }, [history]);

  return (
    <Screen>
      <ThemedText type="h1">Workout History</ThemedText>

      {grouped.length === 0 ? (
        <EmptyState
          title="No Workouts Yet"
          message="Complete your first workout to see it here."
          ctaLabel="Start Workout"
          ctaHref="/workout"
        />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={([date]) => date}
          renderItem={([date, workouts]) => (
            <View style={styles.dateGroup}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.dateLabel}>
                {date}
              </ThemedText>
              {workouts.map((workout) => (
                <Card key={workout.id} style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <ThemedText type="h3">{workout.name ?? 'Workout'}</ThemedText>
                    <ThemedText type="small" themeColor="textMuted">
                      {formatDuration(workout.durationSeconds)}
                    </ThemedText>
                  </View>
                  <View style={styles.workoutStats}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {workout.exercises.length} exercises · {workout.completedSets} sets · {workout.totalReps} reps
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {workout.totalVolume.toLocaleString()} kg volume
                    </ThemedText>
                  </View>
                  <View style={styles.exerciseList}>
                    {workout.exercises.map((ex) => (
                      <ThemedText key={ex.exerciseId} type="small" themeColor="textMuted">
                        {ex.exerciseName} — {ex.sets.filter((s) => s.isCompleted).length} sets
                      </ThemedText>
                    ))}
                  </View>
                </Card>
              ))}
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </Screen>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.four,
  },
  dateGroup: {
    gap: Spacing.two,
  },
  dateLabel: {
    marginBottom: Spacing.one,
  },
  workoutCard: {
    gap: Spacing.two,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutStats: {
    gap: 2,
  },
  exerciseList: {
    gap: 2,
    marginTop: Spacing.one,
  },
});
