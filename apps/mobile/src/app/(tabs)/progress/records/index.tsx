/**
 * Personal Records — §16: auto-detected PRs.
 * §1.1: strictly greater, never equal. §1.2: max_reps scoped per weight.
 */

import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useWorkoutHistory, type PersonalRecord } from '@/stores/workout-history';

export default function PersonalRecordsScreen() {
  const { getPersonalRecords } = useWorkoutHistory();
  const records = getPersonalRecords();

  // Group by exercise
  const grouped = useMemo(() => {
    const map = new Map<string, PersonalRecord[]>();
    for (const pr of records) {
      const existing = map.get(pr.exerciseId) ?? [];
      existing.push(pr);
      map.set(pr.exerciseId, existing);
    }
    return [...map.entries()].sort((a, b) => {
      const latestA = Math.max(...a[1].map((r) => new Date(r.achievedAt).getTime()));
      const latestB = Math.max(...b[1].map((r) => new Date(r.achievedAt).getTime()));
      return latestB - latestA;
    });
  }, [records]);

  return (
    <Screen>
      <ThemedText type="h1">Personal Records</ThemedText>

      {grouped.length === 0 ? (
        <EmptyState
          title="No Personal Records Yet"
          message="Complete a workout with heavy sets to set your first PRs."
        />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={([exerciseId]) => exerciseId}
          renderItem={([exerciseId, prs]) => {
            const exerciseName = prs[0].exerciseName;
            return (
              <Card style={styles.card}>
                <ThemedText type="h3">{exerciseName}</ThemedText>
                {prs.map((pr) => (
                  <View key={pr.prType} style={styles.prRow}>
                    <ThemedText type="default" themeColor="textSecondary">
                      {formatPRType(pr.prType)}
                    </ThemedText>
                    <ThemedText type="bodyStrong" themeColor="primary">
                      {formatPRValue(pr)}
                    </ThemedText>
                  </View>
                ))}
                <ThemedText type="small" themeColor="textMuted">
                  Last: {new Date(prs[0].achievedAt).toLocaleDateString()}
                </ThemedText>
              </Card>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </Screen>
  );
}

function formatPRType(type: string): string {
  switch (type) {
    case 'max_weight': return 'Max Weight';
    case 'max_e1rm': return 'Est. 1RM';
    case 'max_reps': return 'Max Reps';
    case 'max_volume': return 'Best Volume';
    default: return type;
  }
}

function formatPRValue(pr: PersonalRecord): string {
  switch (pr.prType) {
    case 'max_weight': return `${pr.value} kg`;
    case 'max_e1rm': return `${pr.value.toFixed(1)} kg`;
    case 'max_reps': return `${pr.value} reps @ ${pr.weight} kg`;
    case 'max_volume': return `${pr.value.toLocaleString()} kg`;
    default: return `${pr.value}`;
  }
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.two,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
