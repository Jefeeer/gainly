import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useActiveWorkout } from '@/stores/active-workout';

export default function WorkoutHomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { hasActiveWorkout } = useActiveWorkout();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="h1">Workout</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Track your training</ThemedText>
          </View>
          {hasActiveWorkout && (
            <TouchableOpacity 
              style={[styles.activeBtn, { backgroundColor: '#10B981' + '15' }]}
              onPress={() => router.push('/workout/active')}
            >
              <View style={[styles.activeDot, { backgroundColor: '#10B981' }]} />
              <ThemedText type="smallBold" style={{ color: '#10B981' }}>Active</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Start */}
        <TouchableOpacity 
          style={[styles.primaryCard, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/workout/active')}
        >
          <View style={styles.primaryContent}>
            <View style={styles.primaryIcon}>
              <Ionicons name="play" size={32} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="h3" style={{ color: '#fff' }}>Start Workout</ThemedText>
              <ThemedText type="small" style={{ color: '#fff', opacity: 0.8 }}>
                {hasActiveWorkout ? 'Continue your session' : 'Begin a new training session'}
              </ThemedText>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/workout/search')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' + '15' }]}>
              <Ionicons name="search" size={24} color="#3B82F6" />
            </View>
            <ThemedText type="defaultBold">Find Exercise</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Browse 300+ exercises</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/workout/templates')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' + '15' }]}>
              <Ionicons name="copy" size={24} color="#F59E0B" />
            </View>
            <ThemedText type="defaultBold">Templates</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Quick start workouts</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Programs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3">Programs</ThemedText>
            <TouchableOpacity>
              <ThemedText type="small" themeColor="primary">See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.programCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/workout/programs')}
          >
            <View style={styles.programContent}>
              <View style={[styles.programIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                <Ionicons name="calendar" size={24} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultBold">No Programs Yet</ThemedText>
                <ThemedText type="small" themeColor="textMuted">
                  Schedule workouts across weeks
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3">Recent Workouts</ThemedText>
            <TouchableOpacity onPress={() => router.push('/progress/history')}>
              <ThemedText type="small" themeColor="primary">See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
            <ThemedText type="default" themeColor="textMuted">No workouts yet</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Start your first workout to see it here</ThemedText>
          </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 24,
  },
  activeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  primaryCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  primaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  primaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  programCard: {
    padding: 16,
    borderRadius: 16,
  },
  programContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
