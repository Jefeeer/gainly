/**
 * MetricCard — §6: metric-md value + caption label + optional trend chip.
 * React Native version for mobile app.
 */

import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from './themed-text';
import { Card } from './card';
import { Spacing } from '@/constants/theme';

export type MetricCardProps = {
  value: string | number;
  label: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value?: string;
  };
  style?: ViewStyle;
};

const TREND_GLYPHS = { up: '▲', down: '▼', neutral: '—' } as const;

export function MetricCard({ value, label, trend, style }: MetricCardProps) {
  return (
    <Card style={[styles.card, style]}>
      <ThemedText type="subtitle" style={styles.value}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {trend ? (
        <View style={styles.trend}>
          <ThemedText
            type="smallBold"
            themeColor={trend.direction === 'up' ? 'primary' : trend.direction === 'down' ? 'error' : 'textSecondary'}
          >
            {TREND_GLYPHS[trend.direction]}
          </ThemedText>
          {trend.value ? (
            <ThemedText type="small" themeColor="textSecondary">
              {trend.value}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: Spacing.one,
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
