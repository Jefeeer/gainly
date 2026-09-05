/**
 * Template editor — edit template name, exercises, and suggested sets/reps/weight.
 * §14: template contains name, description, exercises, suggested sets, reps, weight, rest.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTemplates, type TemplateExercise } from '@/stores/templates';

export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const { templates, updateTemplate, removeExercise, updateExercise } = useTemplates();
  const template = useMemo(() => templates.find((t) => t.id === id), [templates, id]);

  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');

  if (!template) {
    return (
      <Screen centered>
        <ThemedText type="h3">Template Not Found</ThemedText>
      </Screen>
    );
  }

  function handleSave() {
    updateTemplate(template.id, { name: name.trim(), description: description.trim() });
    router.back();
  }

  function handleRemoveExercise(exerciseId: string) {
    removeExercise({ templateId: template.id, exerciseId });
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Template name */}
        <ThemedText type="small" themeColor="textSecondary">Name</ThemedText>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
          value={name}
          onChangeText={setName}
          placeholder="Template name"
          placeholderTextColor={theme.textSecondary}
        />

        {/* Description */}
        <ThemedText type="small" themeColor="textSecondary">Description</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={2}
        />

        {/* Exercises */}
        <ThemedText type="h3" style={styles.sectionTitle}>
          Exercises ({template.exercises.length})
        </ThemedText>

        {template.exercises.length === 0 ? (
          <Card>
            <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
              No exercises yet. Add exercises from the workout search.
            </ThemedText>
          </Card>
        ) : (
          template.exercises.map((ex) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              onUpdate={(updates) =>
                updateExercise({
                  templateId: template.id,
                  exerciseId: ex.id,
                  updates,
                })
              }
              onRemove={() => handleRemoveExercise(ex.id)}
              theme={theme}
            />
          ))
        )}

        {/* Save */}
        <Button label="Save Template" onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}

function ExerciseRow({
  exercise,
  onUpdate,
  onRemove,
  theme,
}: {
  exercise: TemplateExercise;
  onUpdate: (updates: Partial<Pick<TemplateExercise, 'suggestedSets' | 'suggestedReps' | 'suggestedWeight' | 'restSeconds'>>) => void;
  onRemove: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Card style={styles.exerciseRow}>
      <View style={styles.exerciseHeader}>
        <ThemedText type="bodyStrong" style={styles.exerciseName}>
          {exercise.exerciseName}
        </ThemedText>
        <Pressable onPress={onRemove}>
          <ThemedText type="small" themeColor="error">Remove</ThemedText>
        </Pressable>
      </View>

      <View style={styles.exerciseFields}>
        <View style={styles.field}>
          <ThemedText type="small" themeColor="textMuted">Sets</ThemedText>
          <TextInput
            style={[styles.smallInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={exercise.suggestedSets.toString()}
            onChangeText={(t) => {
              const n = parseInt(t, 10);
              if (!isNaN(n) && n > 0) onUpdate({ suggestedSets: n });
            }}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.field}>
          <ThemedText type="small" themeColor="textMuted">Reps</ThemedText>
          <TextInput
            style={[styles.smallInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={exercise.suggestedReps.toString()}
            onChangeText={(t) => {
              const n = parseInt(t, 10);
              if (!isNaN(n) && n > 0) onUpdate({ suggestedReps: n });
            }}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.field}>
          <ThemedText type="small" themeColor="textMuted">Rest</ThemedText>
          <TextInput
            style={[styles.smallInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={exercise.restSeconds.toString()}
            onChangeText={(t) => {
              const n = parseInt(t, 10);
              if (!isNaN(n) && n >= 0) onUpdate({ restSeconds: n });
            }}
            keyboardType="numeric"
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  exerciseRow: {
    gap: Spacing.two,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    flex: 1,
  },
  exerciseFields: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  field: {
    gap: 2,
  },
  smallInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    textAlign: 'center',
    fontSize: 14,
  },
});
