/**
 * Progress Overview — §18: dedicated progress sections.
 * Shows workout stats, streak, recent PRs, and quick links to sub-sections.
 */

import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useWorkoutHistory } from '@/stores/workout-history';

export default function ProgressOverviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { getWorkoutCount, getStreak, getPersonalRecords, getWeeklyStats } = useWorkoutHistory();

  const workoutCount = getWorkoutCount();
  const streak = getStreak();
  const prs = getPersonalRecords();
  const weeklyStats = getWeeklyStats(4);
  const thisWeek = weeklyStats[weeklyStats.length - 1];

  const menuItems = [
    { icon: 'time' as const, label: 'Workout History', route: '/progress/history', color: '#3B82F6' },
    { icon: 'trophy' as const, label: 'Personal Records', route: '/progress/records', color: '#F59E0B' },
    { icon: 'body' as const, label: 'Body & Measurements', route: '/progress/body', color: '#10B981' },
    { icon: 'pulse' as const, label: 'Activity', route: '/progress/activity', color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="h1">Progress</ThemedText>
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="stats-chart" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}
            onPress={() => router.push('/progress/history')}
          >
            <Ionicons name="barbell" size={24} color={colors.primary} />
            <ThemedText type="h2" style={{ color: colors.primary }}>{workoutCount}</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Workouts</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#10B981' + '15' }]}
          >
            <Ionicons name="flame" size={24} color="#10B981" />
            <ThemedText type="h2" style={{ color: '#10B981' }}>{streak}</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Day Streak</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#F59E0B' + '15' }]}
            onPress={() => router.push('/progress/records')}
          >
            <Ionicons name="trophy" size={24} color="#F59E0B" />
            <ThemedText type="h2" style={{ color: '#F59E0B' }}>{prs.length}</ThemedText>
            <ThemedText type="small" themeColor="textMuted">PRs</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Weekly Summary */}
        {thisWeek && thisWeek.workoutsCompleted > 0 && (
          <View style={[styles.weekCard, { backgroundColor: colors.surface }]}>
            <View style={styles.weekHeader}>
              <ThemedText type="h3">This Week</ThemedText>
              <View style={[styles.weekBadge, { backgroundColor: '#10B981' + '15' }]}>
                <ThemedText type="small" style={{ color: '#10B981' }}>Active</ThemedText>
              </View>
            </View>
            <View style={styles.weekStats}>
              <View style={styles.weekStat}>
                <ThemedText type="h3" style={{ color: colors.primary }}>{thisWeek.workoutsCompleted}</ThemedText>
                <ThemedText type="small" themeColor="textMuted">Workouts</ThemedText>
              </View>
              <View style={[styles.weekDivider, { backgroundColor: colors.border }]} />
              <View style={styles.weekStat}>
                <ThemedText type="h3" style={{ color: '#10B981' }}>{Math.round(thisWeek.totalDuration / 60)}</ThemedText>
                <ThemedText type="small" themeColor="textMuted">Minutes</ThemedText>
              </View>
              <View style={[styles.weekDivider, { backgroundColor: colors.border }]} />
              <View style={styles.weekStat}>
                <ThemedText type="h3" style={{ color: '#F59E0B' }}>{thisWeek.totalVolume.toLocaleString()}</ThemedText>
                <ThemedText type="small" themeColor="textMuted">Volume (kg)</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Recent PRs */}
        {prs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3">Recent PRs</ThemedText>
              <TouchableOpacity onPress={() => router.push('/progress/records')}>
                <ThemedText type="small" themeColor="primary">See All</ThemedText>
              </TouchableOpacity>
            </View>
            
            {prs.slice(0, 3).map((pr, i) => (
              <TouchableOpacity 
                key={`${pr.exerciseId}-${pr.prType}-${pr.achievedAt}`}
                style={[styles.prCard, { backgroundColor: colors.surface }]}
              >
                <View style={[styles.prIcon, { backgroundColor: '#F59E0B' + '15' }]}>
                  <Ionicons name="trophy" size={16} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultBold">{pr.exerciseName}</ThemedText>
                  <ThemedText type="small" themeColor="textMuted">{formatPRType(pr.prType)}</ThemedText>
                </View>
                <ThemedText type="h3" style={{ color: '#F59E0B' }}>{formatPRValue(pr)}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>More</ThemedText>
          
          {menuItems.map((item, i) => (
            <TouchableOpacity 
              key={i}
              style={[styles.menuCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <ThemedText type="default" style={{ flex: 1 }}>{item.label}</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {workoutCount === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
            <ThemedText type="default" themeColor="textMuted">Complete your first workout to see progress</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatPRType(prType: string): string {
  switch (prType) {
    case 'max_weight': return 'Max Weight';
    case 'max_e1rm': return 'Est. 1RM';
    case 'max_reps': return 'Max Reps';
    case 'max_volume': return 'Max Volume';
    default: return prType;
  }
}

function formatPRValue(pr: { prType: string; value: number; weight: number | null; reps: number | null }): string {
  switch (pr.prType) {
    case 'max_weight':
      return `${pr.value}kg`;
    case 'max_e1rm':
      return `${pr.value.toFixed(1)}kg`;
    case 'max_reps':
      return `${pr.value}`;
    case 'max_volume':
      return `${pr.value.toLocaleString()}kg`;
    default:
      return `${pr.value}`;
  }
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
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  weekCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weekStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekStat: {
    flex: 1,
    alignItems: 'center',
  },
  weekDivider: {
    width: 1,
    height: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  prIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
});
