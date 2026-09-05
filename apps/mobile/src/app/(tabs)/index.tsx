import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const today = WEEKDAY_FORMATTER.format(new Date());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="small" themeColor="primary" style={styles.logo}>GAINLY</ThemedText>
            <ThemedText type="h1" style={styles.greeting}>Welcome back 👋</ThemedText>
            <ThemedText type="small" themeColor="textMuted">{today}</ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.avatar, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/profile')}
          >
            <ThemedText type="smallBold" style={{ color: '#fff' }}>DU</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}
            onPress={() => router.push('/workout')}
          >
            <Ionicons name="flame" size={24} color={colors.primary} />
            <ThemedText type="h2" style={{ color: colors.primary }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Day Streak</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#10B981' + '15' }]}
            onPress={() => router.push('/progress')}
          >
            <Ionicons name="bar-chart" size={24} color="#10B981" />
            <ThemedText type="h2" style={{ color: '#10B981' }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Workouts</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#F59E0B' + '15' }]}
            onPress={() => router.push('/nutrition')}
          >
            <Ionicons name="nutrition" size={24} color="#F59E0B" />
            <ThemedText type="h2" style={{ color: '#F59E0B' }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Calories</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>Quick Actions</ThemedText>
          
          <TouchableOpacity 
            style={[styles.primaryAction, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/workout')}
          >
            <View style={styles.primaryActionContent}>
              <View>
                <ThemedText type="h3" style={{ color: '#fff', marginBottom: 4 }}>Start Workout</ThemedText>
                <ThemedText type="small" style={{ color: '#fff', opacity: 0.8 }}>Begin your training session</ThemedText>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/workout/templates')}
            >
              <Ionicons name="copy" size={20} color={colors.primary} />
              <ThemedText type="smallBold">Templates</ThemedText>
              <ThemedText type="small" themeColor="textMuted">Quick start</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/progress/history')}
            >
              <Ionicons name="time" size={20} color="#10B981" />
              <ThemedText type="smallBold">History</ThemedText>
              <ThemedText type="small" themeColor="textMuted">Past workouts</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/progress/body')}
            >
              <Ionicons name="scale" size={20} color="#F59E0B" />
              <ThemedText type="smallBold">Body Stats</ThemedText>
              <ThemedText type="small" themeColor="textMuted">Track changes</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/nutrition')}
            >
              <Ionicons name="restaurant" size={20} color="#EF4444" />
              <ThemedText type="smallBold">Nutrition</ThemedText>
              <ThemedText type="small" themeColor="textMuted">Log meals</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Getting Started */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>Getting Started</ThemedText>
          
          {[
            { icon: 'checkmark-circle' as const, text: 'Complete your profile', done: false },
            { icon: 'fitness' as const, text: 'Log your first workout', done: false },
            { icon: 'nutrition' as const, text: 'Track your nutrition', done: false },
            { icon: 'trophy' as const, text: 'Set a fitness goal', done: false },
          ].map((item, i) => (
            <View key={i} style={[styles.checklistItem, { backgroundColor: colors.surface }]}>
              <Ionicons 
                name={item.icon} 
                size={20} 
                color={item.done ? '#10B981' : colors.textMuted} 
              />
              <ThemedText 
                type="default" 
                style={{ 
                  textDecorationLine: item.done ? 'line-through' : 'none',
                  opacity: item.done ? 0.5 : 1,
                }}
              >
                {item.text}
              </ThemedText>
            </View>
          ))}
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
  logo: {
    letterSpacing: 2,
    fontWeight: '700',
  },
  greeting: {
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  primaryAction: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  primaryActionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    gap: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
});
