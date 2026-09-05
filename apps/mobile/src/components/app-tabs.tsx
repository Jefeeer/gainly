import { Tabs, useRouter, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  progress: 'trending-up',
  workout: 'barbell',
  nutrition: 'restaurant',
  profile: 'person',
};

export default function AppTabs() {
  const colors = useTheme();
  const { navigate } = useRouter();
  const pathname = usePathname();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundElement, borderTopColor: colors.border }]}>
      {Object.entries(TAB_ICONS).map(([key, icon]) => {
        const isActive = pathname.startsWith(`/${key}`);
        const isCenter = key === 'workout';

        if (isCenter) {
          return (
            <Pressable
              key={key}
              style={styles.centerButtonWrapper}
              onPress={() => navigate(`/${key}` as any)}
            >
              <View style={[styles.centerButtonInner, { backgroundColor: colors.primary }]}>
                <Ionicons name={icon} size={26} color={colors.onPrimary} />
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={key}
            style={styles.tab}
            onPress={() => navigate(`/${key}` as any)}
          >
            <Ionicons
              name={icon}
              size={22}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <View style={[styles.indicator, isActive && { backgroundColor: colors.primary }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 12,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 72,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 6,
  },
  indicator: {
    height: 3,
    width: 20,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  centerButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
