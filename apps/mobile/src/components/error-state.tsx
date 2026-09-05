import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';

export type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

/**
 * Error state (§85): friendly message — never a raw exception string —
 * with a Retry action. Keep it simple for RN; web has the richer ErrorState in @gainly/ui.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="h3" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
      {onRetry ? <Button label="Retry" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
