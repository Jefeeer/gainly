import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

const { width } = Dimensions.get('window');
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export default function HomeScreen() {
  const colors = useTheme();
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
            <ThemedText type="smallBold" style={{ color: colors.onPrimary }}>DU</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Hero Stats Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.heroContent}>
            <View>
              <ThemedText type="small" style={{ color: colors.onPrimary, opacity: 0.7 }}>TODAY'S PROGRESS</ThemedText>
              <ThemedText type="hero" style={{ color: colors.onPrimary }}>0</ThemedText>
              <ThemedText type="small" style={{ color: colors.onPrimary, opacity: 0.7 }}>calories burned</ThemedText>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <ThemedText type="h2" style={{ color: colors.onPrimary }}>0</ThemedText>
                <ThemedText type="small" style={{ color: colors.onPrimary, opacity: 0.7 }}>Workouts</ThemedText>
              </View>
              <View style={[styles.heroDivider, { backgroundColor: colors.onPrimary }]} />
              <View style={styles.heroStatItem}>
                <ThemedText type="h2" style={{ color: colors.onPrimary }}>0</ThemedText>
                <ThemedText type="small" style={{ color: colors.onPrimary, opacity: 0.7 }}>Minutes</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/progress')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#FFB800' + '20' }]}>
              <Ionicons name="flame" size={20} color="#FFB800" />
            </View>
            <ThemedText type="h3" style={{ color: '#FFB800' }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Streak</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/progress/records')}
          >
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="trophy" size={20} color={colors.primary} />
            </View>
            <ThemedText type="h3" style={{ color: colors.primary }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">PRs</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/nutrition')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#00F0FF' + '20' }]}>
              <Ionicons name="flash" size={20} color="#00F0FF" />
            </View>
            <ThemedText type="h3" style={{ color: '#00F0FF' }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Calories</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Start Workout CTA */}
        <TouchableOpacity 
          style={[styles.ctaCard, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/workout/active')}
        >
          <View style={styles.ctaContent}>
            <View style={styles.ctaIconContainer}>
              <Ionicons name="play" size={32} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="h3" style={{ color: colors.onPrimary }}>START WORKOUT</ThemedText>
              <ThemedText type="small" style={{ color: colors.onPrimary, opacity: 0.7 }}>
                Begin your training session
              </ThemedText>
            </View>
            <Ionicons name="arrow-forward" size={24} color={colors.onPrimary} />
          </View>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>QUICK ACTIONS</ThemedText>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/workout/templates')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FF6B6B' + '20' }]}>
                <Ionicons name="copy" size={20} color="#FF6B6B" />
              </View>
              <ThemedText type="smallBold">Templates</ThemedText>
              <ThemedText type="small" themeColor="textMuted">Quick start</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/progress/history')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#00F0FF' + '20' }]}>
                <Ionicons name="time" size={20} color="#00F0FF" />
              </View>
              <ThemedText type="smallBold">History</ThemedText>
              <ThemedText type="small" themeColor="textMuted">Past workouts</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/progress/body')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#C8FF00' + '20' }]}>
                <Ionicons name="pulse" size={20} color="#C8FF00" />
              </View>
              <ThemedText type="smallBold">Body Stats</ThemedText>
              <ThemedText type="small" themeColor="textMuted">Track changes</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/nutrition')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFB800' + '20' }]}>
                <Ionicons name="nutrition" size={20} color="#FFB800" />
              </View>
              <ThemedText type="smallBold">Nutrition</ThemedText>
              <ThemedText type="small" themeColor="textMuted">Log meals</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Getting Started */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>GETTING STARTED</ThemedText>
          
          {[
            { icon: 'checkmark-circle' as const, text: 'Complete your profile', done: false },
            { icon: 'fitness' as const, text: 'Log your first workout', done: false },
            { icon: 'nutrition' as const, text: 'Track your nutrition', done: false },
            { icon: 'trophy' as const, text: 'Set a fitness goal', done: false },
          ].map((item, i) => (
            <View key={i} style={[styles.checklistItem, { backgroundColor: colors.card }]}>
              <Ionicons 
                name={item.icon} 
                size={20} 
                color={item.done ? colors.primary : colors.textMuted} 
              />
              <ThemedText 
                type="default" 
                style={{ 
                  flex: 1,
                  textDecorationLine: item.done ? 'line-through' : 'none',
                  opacity: item.done ? 0.5 : 1,
                }}
              >
                {item.text}
              </ThemedText>
              {item.done && <Ionicons name="checkmark" size={16} color={colors.primary} />}
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
    letterSpacing: 3,
    fontWeight: '800',
    fontSize: 12,
  },
  greeting: {
    marginTop: 4,
    fontSize: 28,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 40,
    opacity: 0.3,
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  ctaCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ctaIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    letterSpacing: 1,
    marginBottom: 16,
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
    gap: 6,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
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
