import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useActiveWorkout } from '@/stores/active-workout';

export default function WorkoutHomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { hasActiveWorkout } = useActiveWorkout();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="h1" style={styles.title}>WORKOUT</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Track your training</ThemedText>
          </View>
          {hasActiveWorkout && (
            <TouchableOpacity 
              style={[styles.activeBtn, { backgroundColor: colors.primary + '20' }]}
              onPress={() => router.push('/workout/active')}
            >
              <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              <ThemedText type="smallBold" style={{ color: colors.primary }}>ACTIVE</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Start Button */}
        <TouchableOpacity 
          style={[styles.heroButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/workout/active')}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="play" size={40} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="h2" style={{ color: colors.onPrimary }}>START WORKOUT</ThemedText>
              <ThemedText type="small" style={{ color: colors.onPrimary, opacity: 0.7 }}>
                {hasActiveWorkout ? 'Continue your session' : 'Begin a new training session'}
              </ThemedText>
            </View>
            <Ionicons name="arrow-forward" size={24} color={colors.onPrimary} />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/workout/search')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#00F0FF' + '20' }]}>
              <Ionicons name="search" size={24} color="#00F0FF" />
            </View>
            <ThemedText type="defaultBold">Find Exercise</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Browse 300+ exercises</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/workout/templates')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFB800' + '20' }]}>
              <Ionicons name="copy" size={24} color="#FFB800" />
            </View>
            <ThemedText type="defaultBold">Templates</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Quick start workouts</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Programs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3" style={styles.sectionTitle}>PROGRAMS</ThemedText>
            <TouchableOpacity>
              <ThemedText type="small" themeColor="primary">See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.programCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/workout/programs')}
          >
            <View style={styles.programContent}>
              <View style={[styles.programIcon, { backgroundColor: '#C8FF00' + '20' }]}>
                <Ionicons name="calendar" size={24} color={colors.primary} />
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
            <ThemedText type="h3" style={styles.sectionTitle}>RECENT WORKOUTS</ThemedText>
            <TouchableOpacity onPress={() => router.push('/progress/history')}>
              <ThemedText type="small" themeColor="primary">See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
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
  title: {
    letterSpacing: 2,
    fontSize: 28,
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
  heroButton: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
    borderRadius: 20,
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
  sectionTitle: {
    letterSpacing: 1,
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
