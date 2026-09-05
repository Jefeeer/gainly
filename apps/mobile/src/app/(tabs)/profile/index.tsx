import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/stores/auth';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);

  const menuItems = [
    { icon: 'person' as const, label: 'Edit Profile', route: '/profile/settings' },
    { icon: 'flag' as const, label: 'Fitness Goals', route: '/profile/goals' },
    { icon: 'notifications' as const, label: 'Notifications', route: '/profile/notifications' },
    { icon: 'card' as const, label: 'Subscription', route: '/profile/subscription' },
    { icon: 'help-circle' as const, label: 'Help & Support', route: '/profile/help' },
    { icon: 'document-text' as const, label: 'Terms & Privacy', route: '/profile/terms' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="h1">Profile</ThemedText>
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.primary + '10' }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <ThemedText type="h1" style={{ color: '#fff' }}>
              {(user?.displayName ?? 'DU').charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="h3">{user?.displayName ?? 'Demo User'}</ThemedText>
            <ThemedText type="small" themeColor="textMuted">{user?.email ?? 'demo@gainly.app'}</ThemedText>
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
            <ThemedText type="h2" style={{ color: colors.primary }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Workouts</ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
            <ThemedText type="h2" style={{ color: '#10B981' }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Day Streak</ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
            <ThemedText type="h2" style={{ color: '#F59E0B' }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">PRs</ThemedText>
          </View>
        </View>

        {/* Subscription Banner */}
        <TouchableOpacity style={[styles.proBanner, { backgroundColor: colors.primary }]}>
          <View style={styles.proContent}>
            <Ionicons name="diamond" size={24} color="#fff" />
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultBold" style={{ color: '#fff' }}>Gainly Pro</ThemedText>
              <ThemedText type="small" style={{ color: '#fff', opacity: 0.8 }}>Unlock advanced features</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
          {menuItems.map((item, i) => (
            <TouchableOpacity 
              key={i}
              style={[
                styles.menuItem,
                i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
              ]}
              onPress={() => router.push(item.route)}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={20} color={colors.text} />
                <ThemedText type="default">{item.label}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: '#EF4444' + '10' }]}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <ThemedText type="defaultBold" style={{ color: '#EF4444' }}>Sign Out</ThemedText>
        </TouchableOpacity>

        {/* Version */}
        <ThemedText type="small" themeColor="textMuted" style={styles.version}>
          Gainly v1.0.0
        </ThemedText>
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
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  proBanner: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  proContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
  },
  version: {
    textAlign: 'center',
    marginBottom: 32,
  },
});
