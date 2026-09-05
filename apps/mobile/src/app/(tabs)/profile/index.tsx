import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/stores/auth';

export default function ProfileScreen() {
  const colors = useTheme();
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
          <View>
            <ThemedText type="h1" style={styles.title}>PROFILE</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Your account</ThemedText>
          </View>
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
            <ThemedText type="h1" style={{ color: colors.onPrimary }}>
              {(user?.displayName ?? 'DU').charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="h2" style={{ color: colors.onPrimary }}>{user?.displayName ?? 'Demo User'}</ThemedText>
            <ThemedText type="small" style={{ color: colors.onPrimary, opacity: 0.7 }}>{user?.email ?? 'demo@gainly.app'}</ThemedText>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil" size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <ThemedText type="h2" style={{ color: colors.primary }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Workouts</ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <ThemedText type="h2" style={{ color: '#FFB800' }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">Day Streak</ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <ThemedText type="h2" style={{ color: '#00F0FF' }}>0</ThemedText>
            <ThemedText type="small" themeColor="textMuted">PRs</ThemedText>
          </View>
        </View>

        {/* Pro Banner */}
        <TouchableOpacity style={[styles.proBanner, { backgroundColor: colors.card }]}>
          <View style={styles.proContent}>
            <View style={[styles.proIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="diamond" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultBold">GAINLY PRO</ThemedText>
              <ThemedText type="small" themeColor="textMuted">Unlock advanced features</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
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
        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: '#FF4757' + '15' }]}>
          <Ionicons name="log-out" size={20} color="#FF4757" />
          <ThemedText type="defaultBold" style={{ color: '#FF4757' }}>SIGN OUT</ThemedText>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
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
  proIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
