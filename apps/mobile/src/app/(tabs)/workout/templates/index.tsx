/**
 * Templates screen — §14: reusable workouts with CRUD and duplicate.
 * Shows preset templates (Push/Pull/Legs) and user-created templates.
 */

import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTemplates, type WorkoutTemplate } from '@/stores/templates';
import { useActiveWorkout } from '@/stores/active-workout';

export default function TemplatesScreen() {
  const theme = useTheme();
  const { templates, initPresets, deleteTemplate, duplicateTemplate } = useTemplates();
  const { startWorkout, addExercise, addSet, hasActiveWorkout } = useActiveWorkout();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    initPresets();
  }, [initPresets]);

  function handleStartFromTemplate(template: WorkoutTemplate) {
    if (hasActiveWorkout) {
      Alert.alert('Active Workout', 'You already have an active workout. Finish or discard it first.');
      return;
    }

    // Start workout and populate exercises from template
    startWorkout({ name: template.name, templateId: template.id });
    for (const ex of template.exercises) {
      addExercise({ exerciseId: ex.exerciseId, exerciseName: ex.exerciseName });
      const state = useActiveWorkout.getState();
      const lastEx = state.exercises[state.exercises.length - 1];
      if (lastEx) {
        for (let i = 0; i < ex.suggestedSets; i++) {
          addSet({ exerciseClientId: lastEx.id });
        }
      }
    }
  }

  function handleDuplicate(template: WorkoutTemplate) {
    const newId = duplicateTemplate(template.id);
    if (newId) {
      Alert.alert('Duplicated', `"${template.name}" has been duplicated.`);
    }
  }

  function handleDelete(template: WorkoutTemplate) {
    if (template.isPreset) {
      Alert.alert('Cannot Delete', 'Preset templates cannot be deleted.');
      return;
    }
    Alert.alert('Delete Template', `Delete "${template.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(template.id) },
    ]);
  }

  function handleCreate() {
    if (newName.trim()) {
      useTemplates.getState().createTemplate({ name: newName.trim() });
      setNewName('');
      setShowCreate(false);
    }
  }

  const renderTemplate = ({ item }: { item: WorkoutTemplate }) => (
    <Card style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <View style={styles.templateInfo}>
          <ThemedText type="h3">{item.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {item.exercises.length} exercises · {item.exercises.reduce((s, e) => s + e.suggestedSets, 0)} sets
          </ThemedText>
          {item.description ? (
            <ThemedText type="small" themeColor="textMuted">
              {item.description}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {/* Exercise preview */}
      <View style={styles.exerciseList}>
        {item.exercises.slice(0, 3).map((ex) => (
          <ThemedText key={ex.id} type="small" themeColor="textSecondary">
            {ex.exerciseName} — {ex.suggestedSets}×{ex.suggestedReps}
          </ThemedText>
        ))}
        {item.exercises.length > 3 ? (
          <ThemedText type="small" themeColor="textMuted">
            +{item.exercises.length - 3} more
          </ThemedText>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          label="Start"
          size="sm"
          onPress={() => handleStartFromTemplate(item)}
        />
        <Pressable
          onPress={() => handleDuplicate(item)}
          style={styles.actionLink}
        >
          <ThemedText type="small" themeColor="primary">Duplicate</ThemedText>
        </Pressable>
        {!item.isPreset ? (
          <Pressable
            onPress={() => handleDelete(item)}
            style={styles.actionLink}
          >
            <ThemedText type="small" themeColor="error">Delete</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="h1">Templates</ThemedText>
        <Button
          label="+ New"
          size="sm"
          onPress={() => setShowCreate(!showCreate)}
        />
      </View>

      {/* Create new template */}
      {showCreate ? (
        <Card style={styles.createCard}>
          <ThemedText type="h3">New Template</ThemedText>
          <View style={styles.createRow}>
            <View style={styles.createInput}>
              <ThemedText type="small" themeColor="textSecondary">Name</ThemedText>
              <ThemedText
                type="default"
                style={[styles.nameInput, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
              >
                {newName || ''}
              </ThemedText>
            </View>
            <Button label="Create" size="sm" onPress={handleCreate} />
          </View>
        </Card>
      ) : null}

      {/* Template list */}
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        renderItem={renderTemplate}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Templates Yet"
            message="Create a template to save your favorite workouts."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createCard: {
    gap: Spacing.two,
  },
  createRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-end',
  },
  createInput: {
    flex: 1,
    gap: Spacing.one,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  list: {
    gap: Spacing.three,
  },
  templateCard: {
    gap: Spacing.two,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  templateInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseList: {
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  actionLink: {
    paddingVertical: Spacing.one,
  },
});
