import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export type ButtonProps = {
  label: string;
  href?: Href;
  onPress?: () => void;
};

/** Primary-filled CTA. Only variant built so far - structure/empty-state work doesn't need more. */
export function Button({ label, href, onPress }: ButtonProps) {
  const content = (
    <ThemedView type="primary" style={styles.button}>
      <ThemedText type="smallBold" themeColor="onPrimary">
        {label}
      </ThemedText>
    </ThemedView>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable style={({ pressed }) => [pressed && styles.pressed]}>{content}</Pressable>
      </Link>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  pressed: {
    opacity: 0.8,
  },
});
