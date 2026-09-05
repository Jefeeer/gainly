/**
 * SetRow — the highest-traffic component in the app (design-system.md §6).
 * Columns: set #, previous (muted), weight input, reps input, complete-toggle.
 * Complete toggle is a full-row tap target, fires optimistic update.
 *
 * §49: each input needs accessibilityLabel with set number and field ("Set 2 weight").
 */

import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ActiveSet } from '@/stores/active-workout';

export type SetRowProps = {
  set: ActiveSet;
  previousWeight?: number | null;
  previousReps?: number | null;
  onUpdate: (updates: Partial<Pick<ActiveSet, 'weight' | 'reps'>>) => void;
  onComplete: () => void;
};

export function SetRow({ set, previousWeight, previousReps, onUpdate, onComplete }: SetRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onComplete}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: set.isCompleted ? theme.backgroundSelected : 'transparent',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Set number */}
      <View style={styles.setNumber}>
        <ThemedText type="smallBold" themeColor={set.isCompleted ? 'primary' : 'text'}>
          {set.setNumber}
        </ThemedText>
        {set.setType !== 'normal' ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.setType}>
            {set.setType.slice(0, 1).toUpperCase()}
          </ThemedText>
        ) : null}
      </View>

      {/* Previous performance (muted) */}
      <View style={styles.previous}>
        {previousWeight != null || previousReps != null ? (
          <ThemedText type="small" themeColor="textMuted">
            {previousWeight ?? '—'} × {previousReps ?? '—'}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textMuted">—</ThemedText>
        )}
      </View>

      {/* Weight input */}
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        keyboardType="numeric"
        value={set.weight?.toString() ?? ''}
        onChangeText={(text) => {
          const num = text === '' ? null : parseFloat(text);
          onUpdate({ weight: isNaN(num) ? null : num });
        }}
        accessibilityLabel={`Set ${set.setNumber} weight`}
        returnKeyType="next"
      />

      {/* Reps input */}
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        keyboardType="numeric"
        value={set.reps?.toString() ?? ''}
        onChangeText={(text) => {
          const num = text === '' ? null : parseInt(text, 10);
          onUpdate({ reps: isNaN(num) ? null : num });
        }}
        accessibilityLabel={`Set ${set.setNumber} reps`}
        returnKeyType="done"
      />

      {/* Completion indicator */}
      <View style={[styles.check, { backgroundColor: set.isCompleted ? theme.primary : 'transparent', borderColor: set.isCompleted ? theme.primary : theme.borderStrong }]}>
        {set.isCompleted ? (
          <ThemedText type="smallBold" themeColor="onPrimary">✓</ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    minHeight: 48,
  },
  setNumber: {
    width: 32,
    alignItems: 'center',
  },
  setType: {
    fontSize: 10,
  },
  previous: {
    width: 60,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
