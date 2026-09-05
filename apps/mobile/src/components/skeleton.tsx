import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedView } from './themed-view';
import { useTheme } from '@/hooks/use-theme';

export type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

/**
 * Skeleton loading placeholder (§86). Pulses via Animated opacity;
 * respects reduced-motion by holding a static tint instead.
 */
export function Skeleton({ width = '100%', height = 16, borderRadius, style }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <ThemedView
        type="backgroundElement"
        style={[
          {
            width: width as ViewStyle['width'],
            height,
            borderRadius: borderRadius ?? 8,
          },
          style,
        ]}
      />
    </Animated.View>
  );
}

/** Pre-built skeleton layouts for common screen patterns. */

export function CardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton height={18} width="60%" />
      <Skeleton height={14} width="90%" />
      <Skeleton height={14} width="75%" />
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={skeletonStyles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={skeletonStyles.row}>
          <Skeleton width={48} height={48} borderRadius={12} />
          <View style={skeletonStyles.rowText}>
            <Skeleton height={16} width="70%" />
            <Skeleton height={12} width="45%" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={skeletonStyles.dashboard}>
      <Skeleton height={28} width="50%" />
      <Skeleton height={14} width="35%" />
      <View style={skeletonStyles.card}>
        <Skeleton height={48} width="40%" />
        <Skeleton height={14} width="60%" />
      </View>
      <View style={skeletonStyles.card}>
        <Skeleton height={18} width="55%" />
        <Skeleton height={14} width="80%" />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
  dashboard: {
    gap: 16,
    padding: 16,
  },
});
