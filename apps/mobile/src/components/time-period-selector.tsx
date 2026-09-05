/**
 * TimePeriodSelector — Pill-style selector for time periods.
 * Used in progress stats to filter by Week/Month/Year/All.
 */

import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export type TimePeriod = 'week' | 'month' | 'year' | 'all';

type TimePeriodSelectorProps = {
  selected: TimePeriod;
  onSelect: (period: TimePeriod) => void;
};

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' },
];

export function TimePeriodSelector({ selected, onSelect }: TimePeriodSelectorProps) {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {PERIODS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.pill,
            selected === key && { backgroundColor: colors.primary },
          ]}
          onPress={() => onSelect(key)}
        >
          <ThemedText
            type="smallBold"
            style={{
              color: selected === key ? colors.onPrimary : colors.textMuted,
            }}
          >
            {label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
