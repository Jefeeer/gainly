import { Tabs, useRouter, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
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
              style={styles.centerButton}
              onPress={() => navigate(`/${key}` as any)}
            >
              <View style={[styles.centerButtonInner, { backgroundColor: colors.primary }]}>
                <Ionicons name={icon} size={28} color={colors.onPrimary} />
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
            <View style={[styles.labelContainer, isActive && styles.activeLabelContainer]}>
              <View style={[styles.activeLabel, { backgroundColor: colors.primary }]} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 24,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  labelContainer: {
    height: 3,
    width: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  activeLabelContainer: {
    backgroundColor: 'transparent',
  },
  activeLabel: {
    flex: 1,
    borderRadius: 2,
  },
  centerButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
