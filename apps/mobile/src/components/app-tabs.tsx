/**
 * App Tab Bar — Premium modern fitness app design.
 * Workout tab is center, elevated FAB-style (§7 L386).
 */

import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Platform, Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing, Radius, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TAB_ICONS: Record<string, string> = {
  home: '🏠',
  progress: '📊',
  workout: '💪',
  nutrition: '🍎',
  profile: '👤',
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon="home">Home</TabButton>
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton icon="progress">Progress</TabButton>
          </TabTrigger>
          <TabTrigger name="workout" href="/workout" asChild>
            <WorkoutTabButton>Workout</WorkoutTabButton>
          </TabTrigger>
          <TabTrigger name="nutrition" href="/nutrition" asChild>
            <TabButton icon="nutrition">Nutrition</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="profile">Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon?: string }) {
  const theme = useTheme();
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabSlot, pressed && styles.pressed]}>
      <View style={styles.tabContent}>
        <ThemedText
          type="small"
          style={{ color: isFocused ? theme.primary : theme.textMuted, fontSize: 18 }}
        >
          {TAB_ICONS[icon ?? ''] ?? '•'}
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: isFocused ? theme.primary : theme.textMuted, fontWeight: isFocused ? '600' : '400' }}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function WorkoutTabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabSlot, pressed && { transform: [{ scale: 0.95 }] }]}>
      <View
        style={[
          styles.workoutButton,
          {
            backgroundColor: isFocused ? theme.primary : theme.primaryMuted,
            ...Shadow.medium,
          },
        ]}
      >
        <ThemedText
          type="smallBold"
          style={{ color: isFocused ? theme.onPrimary : theme.primary, fontSize: 12 }}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  return (
    <View {...props} style={styles.tabListContainer}>
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            ...Shadow.large,
          },
        ]}
      >
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
    maxWidth: MaxContentWidth,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  tabContent: {
    alignItems: 'center',
    gap: 2,
  },
  workoutButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
    borderRadius: Radius.lg,
    marginTop: -Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
});
