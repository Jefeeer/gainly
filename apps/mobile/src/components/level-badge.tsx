/**
 * LevelBadge — Shows muscle activation levels with color coding.
 * Gold: trained 5+ times, Bronze: 3-4 times, Wood: 1-2 times.
 */

import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type LevelBadgeProps = {
  gold: number;
  bronze: number;
  wood: number;
};

const LEVEL_COLORS = {
  gold: '#FFD700',
  bronze: '#CD7F32',
  wood: '#8B6914',
};

export function LevelBadge({ gold, bronze, wood }: LevelBadgeProps) {
  const colors = useTheme();

  const levels = [
    { label: 'Gold', count: gold, color: LEVEL_COLORS.gold },
    { label: 'Bronze', count: bronze, color: LEVEL_COLORS.bronze },
    { label: 'Wood', count: wood, color: LEVEL_COLORS.wood },
  ];

  return (
    <View style={styles.container}>
      {levels.map(({ label, count, color }) => (
        <View key={label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <ThemedText type="small" themeColor="textMuted">
            {label}: {count}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
