/**
 * Progress Overview — Dark premium design with big stats and neon accents.
 */

import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useWorkoutHistory } from '@/stores/workout-history';

export default function ProgressOverviewScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { getWorkoutCount, getStreak, getPersonalRecords, getWeeklyStats } = useWorkoutHistory();

  const workoutCount = getWorkoutCount();
  const streak = getStreak();
  const prs = getPersonalRecords();
  const weeklyStats = getWeeklyStats(4);
  const thisWeek = weeklyStats[weeklyStats.length - 1];

  const menuItems = [
    { icon: 'time' as const, label: 'Workout History', route: '/progress/history', color: '#00F0FF' },
    { icon: 'trophy' as const, label: 'Personal Records', route: '/progress/records', color: '#FFB800' },
    { icon: 'body' as const, label: 'Body & Measurements', route: '/progress/body', color: '#C8FF00' },
    { icon: 'pulse' as const, label: 'Activity', route: '/progress/activity', color: '#FF6B6B' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="h1" style={styles.title}>PROGRESS</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Your fitness journey</ThemedText>
          </View>
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="stats-chart" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Hero Stats */}
        <View style={styles.heroStats}>
          <TouchableOpacity 
            style={[styles.heroStatCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/progress/history')}
          >
            <ThemedText type="small" style={{ color: colors.onPrimary, opacity: 0.7 }}>WORKOUTS</ThemedText>
            <ThemedText type="hero" style={{ color: colors.onPrimary }}>{workoutCount}</ThemedText>
          </TouchableOpacity>
          
          <View style={styles.heroStatSide}>
            <TouchableOpacity 
              style={[styles.sideStatCard, { backgroundColor: colors.card }]}
            >
              <ThemedText type="small" themeColor="textMuted">STREAK</ThemedText>
              <ThemedText type="h1" style={{ color: '#FFB800' }}>{streak}</ThemedText>
              <ThemedText type="small" themeColor="textMuted">days</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sideStatCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/progress/records')}
            >
              <ThemedText type="small" themeColor="textMuted">PRs</ThemedText>
              <ThemedText type="h1" style={{ color: colors.primary }}>{prs.length}</ThemedText>
              <ThemedText type="small" themeColor="textMuted">total</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Summary */}
        {thisWeek && thisWeek.workoutsCompleted > 0 && (
          <View style={[styles.weekCard, { backgroundColor: colors.card }]}>
            <View style={styles.weekHeader}>
              <ThemedText type="h3">THIS WEEK</ThemedText>
              <View style={[styles.weekBadge, { backgroundColor: colors.primary + '20' }]}>
                <ThemedText type="small" style={{ color: colors.primary }}>ACTIVE</ThemedText>
              </View>
            </View>
            <View style={styles.weekStats}>
              <View style={styles.weekStat}>
                <ThemedText type="h2" style={{ color: colors.primary }}>{thisWeek.workoutsCompleted}</ThemedText>
                <ThemedText type="small" themeColor="textMuted">Workouts</ThemedText>
              </View>
              <View style={[styles.weekDivider, { backgroundColor: colors.border }]} />
              <View style={styles.weekStat}>
                <ThemedText type="h2" style={{ color: '#00F0FF' }}>{Math.round(thisWeek.totalDuration / 60)}</ThemedText>
                <ThemedText type="small" themeColor="textMuted">Minutes</ThemedText>
              </View>
              <View style={[styles.weekDivider, { backgroundColor: colors.border }]} />
              <View style={styles.weekStat}>
                <ThemedText type="h2" style={{ color: '#FFB800' }}>{thisWeek.totalVolume.toLocaleString()}</ThemedText>
                <ThemedText type="small" themeColor="textMuted">Volume</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Recent PRs */}
        {prs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>RECENT PRs</ThemedText>
              <TouchableOpacity onPress={() => router.push('/progress/records')}>
                <ThemedText type="small" themeColor="primary">See All</ThemedText>
              </TouchableOpacity>
            </View>
            
            {prs.slice(0, 3).map((pr) => (
              <TouchableOpacity 
                key={`${pr.exerciseId}-${pr.prType}-${pr.achievedAt}`}
                style={[styles.prCard, { backgroundColor: colors.card }]}
              >
                <View style={[styles.prIcon, { backgroundColor: '#FFB800' + '20' }]}>
                  <Ionicons name="trophy" size={16} color="#FFB800" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultBold">{pr.exerciseName}</ThemedText>
                  <ThemedText type="small" themeColor="textMuted">{formatPRType(pr.prType)}</ThemedText>
                </View>
                <ThemedText type="h3" style={{ color: '#FFB800' }}>{formatPRValue(pr)}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>MORE</ThemedText>
          
          {menuItems.map((item, i) => (
            <TouchableOpacity 
              key={i}
              style={[styles.menuCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <ThemedText type="default" style={{ flex: 1 }}>{item.label}</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {workoutCount === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
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
  heroStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  heroStatCard: {
    flex: 1.5,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatSide: {
    flex: 1,
    gap: 12,
  },
  sideStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    height: 40,
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
    letterSpacing: 1,
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
