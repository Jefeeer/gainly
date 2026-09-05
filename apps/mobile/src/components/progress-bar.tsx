/**
 * ProgressBar — §6: value conveyed by fill AND numeric label, never bar length alone.
 * React Native version for mobile app.
 */

import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ProgressBarProps = {
  value: number; // 0 to 1
  label?: string;
  showValue?: boolean;
  height?: number;
};

export function ProgressBar({ value, label, showValue = true, height = 8 }: ProgressBarProps) {
  const theme = useTheme();
  const clampedValue = Math.max(0, Math.min(1, value));
  const percentage = Math.round(clampedValue * 100);

  return (
    <View style={styles.container}>
      {(label || showValue) && (
        <View style={styles.labelRow}>
          {label ? (
            <ThemedText type="small" themeColor="textSecondary">
              {label}
            </ThemedText>
          ) : null}
          {showValue ? (
            <ThemedText type="smallBold" themeColor="textSecondary">
              {percentage}%
            </ThemedText>
          ) : null}
        </View>
      )}
      <View
        style={[styles.track, { height, backgroundColor: theme.backgroundElement }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: percentage, min: 0, max: 100 }}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              height,
              backgroundColor: theme.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    width: '100%',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 9999,
  },
});
