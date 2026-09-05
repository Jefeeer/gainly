/**
 * Progress Overview — §18: dedicated progress sections.
 * Shows workout stats, streak, recent PRs, and quick links to sub-sections.
 */

import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { MetricCard } from '@/components/metric-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useWorkoutHistory } from '@/stores/workout-history';

export default function ProgressOverviewScreen() {
  const { getWorkoutCount, getStreak, getPersonalRecords, getWeeklyStats } = useWorkoutHistory();

  const workoutCount = getWorkoutCount();
  const streak = getStreak();
  const prs = getPersonalRecords();
  const weeklyStats = getWeeklyStats(4);
  const thisWeek = weeklyStats[weeklyStats.length - 1];

  return (
    <Screen>
      <ThemedText type="h1">Progress</ThemedText>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <MetricCard
          value={workoutCount.toString()}
          label="Workouts"
        />
        <MetricCard
          value={`${streak}`}
          label="Week Streak"
          trend={streak > 0 ? { direction: 'up', value: '🔥' } : undefined}
        />
      </View>

      {/* This week */}
      {thisWeek && thisWeek.workoutsCompleted > 0 ? (
        <Card>
          <ThemedText type="h3">This Week</ThemedText>
          <View style={styles.weekStats}>
            <ThemedText type="default" themeColor="textSecondary">
              {thisWeek.workoutsCompleted} workout{thisWeek.workoutsCompleted !== 1 ? 's' : ''} · {Math.round(thisWeek.totalDuration / 60)} min
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              {thisWeek.totalVolume.toLocaleString()} kg volume · {thisWeek.totalSets} sets
            </ThemedText>
          </View>
        </Card>
      ) : null}

      {/* Recent PRs */}
      {prs.length > 0 ? (
        <Card>
          <ThemedText type="h3">Recent Personal Records</ThemedText>
          {prs.slice(0, 3).map((pr) => (
            <View key={`${pr.exerciseId}-${pr.prType}-${pr.achievedAt}`} style={styles.prRow}>
              <ThemedText type="bodyStrong">{pr.exerciseName}</ThemedText>
              <ThemedText type="small" themeColor="primary">
                {formatPRValue(pr)}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Quick links */}
      <Card style={styles.linkCard}>
        <Link href="/(tabs)/progress/history" asChild>
          <Pressable style={styles.link}>
            <ThemedText type="bodyStrong">Workout History</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">→</ThemedText>
          </Pressable>
        </Link>
      </Card>

      <Card style={styles.linkCard}>
        <Link href="/(tabs)/progress/records" asChild>
          <Pressable style={styles.link}>
            <ThemedText type="bodyStrong">Personal Records</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">→</ThemedText>
          </Pressable>
        </Link>
      </Card>

      <Card style={styles.linkCard}>
        <Link href="/(tabs)/progress/body" asChild>
          <Pressable style={styles.link}>
            <ThemedText type="bodyStrong">Body & Measurements</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">→</ThemedText>
          </Pressable>
        </Link>
      </Card>

      <Card style={styles.linkCard}>
        <Link href="/(tabs)/progress/activity" asChild>
          <Pressable style={styles.link}>
            <ThemedText type="bodyStrong">Activity</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">→</ThemedText>
          </Pressable>
        </Link>
      </Card>

      {workoutCount === 0 ? (
        <Card>
          <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
            Complete your first workout to see progress data here.
          </ThemedText>
        </Card>
      ) : null}
    </Screen>
  );
}

function formatPRValue(pr: { prType: string; value: number; weight: number | null; reps: number | null }): string {
  switch (pr.prType) {
    case 'max_weight':
      return `${pr.value} kg`;
    case 'max_e1rm':
      return `e1RM ${pr.value.toFixed(1)} kg`;
    case 'max_reps':
      return `${pr.value} reps @ ${pr.weight} kg`;
    case 'max_volume':
      return `${pr.value.toLocaleString()} kg vol`;
    default:
      return `${pr.value}`;
  }
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  weekStats: {
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  linkCard: {
    padding: 0,
  },
  link: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
