/**
 * RestTimer — §12 rest timer component.
 * CircularProgress ring + metric-lg countdown + skip/add-15s actions below.
 * §6: announces "Rest complete" via live region on end.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type RestTimerProps = {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  onSkip: () => void;
  onAddTime: (seconds: number) => void;
};

export function RestTimer({
  isRunning,
  remainingSeconds,
  totalSeconds,
  onSkip,
  onAddTime,
}: RestTimerProps) {
  const theme = useTheme();

  if (!isRunning) return null;

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      {/* Circular progress ring */}
      <View style={styles.timerCircle}>
        <View
          style={[
            styles.ring,
            {
              borderColor: theme.primary,
              opacity: 0.2,
            },
          ]}
        />
        <View
          style={[
            styles.ring,
            styles.ringProgress,
            {
              borderColor: theme.primary,
              // Simple rotation based on progress — in production use SVG/Reanimated
              transform: [{ rotate: `${(1 - progress) * 360}deg` }],
            },
          ]}
        />
        <ThemedText type="title" style={styles.timeText}>
          {timeDisplay}
        </ThemedText>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => onAddTime(15)}
          style={[styles.actionButton, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="smallBold">+15s</ThemedText>
        </Pressable>

        <Pressable
          onPress={onSkip}
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText type="smallBold" themeColor="onPrimary">Skip</ThemedText>
        </Pressable>
      </View>

      {/* Accessibility: announce when timer completes */}
      {remainingSeconds === 0 && isRunning ? (
        <ThemedText accessibilityLiveRegion="polite" style={styles.srOnly}>
          Rest complete
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  timerCircle: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
  },
  ringProgress: {
    // In production, use SVG arc or Reanimated rotation
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  timeText: {
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionButton: {
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});
