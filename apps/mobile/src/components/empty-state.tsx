import { type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';

export type EmptyStateProps = {
  title: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: Href;
};

export function EmptyState({ title, message, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="h3" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
      {ctaLabel && ctaHref ? <Button label={ctaLabel} href={ctaHref} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
