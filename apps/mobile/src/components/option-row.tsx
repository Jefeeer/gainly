import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export type OptionRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionRow({ label, selected, onPress }: OptionRowProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <ThemedView type={selected ? 'backgroundSelected' : 'backgroundElement'} style={styles.row}>
        <ThemedText type="default" themeColor={selected ? 'text' : 'textSecondary'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
