/**
 * Templates screen — Dark premium design with neon accents.
 */

import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useTemplates, type WorkoutTemplate } from '@/stores/templates';
import { useActiveWorkout } from '@/stores/active-workout';

export default function TemplatesScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { templates, initPresets, deleteTemplate, duplicateTemplate } = useTemplates();
  const { startWorkout, addExercise, addSet, hasActiveWorkout } = useActiveWorkout();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    initPresets();
  }, [initPresets]);

  function handleStartFromTemplate(template: WorkoutTemplate) {
    if (hasActiveWorkout) {
      Alert.alert('Active Workout', 'You already have an active workout. Finish or discard it first.');
      return;
    }

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
    router.push('/workout/active');
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

  const getTemplateColor = (index: number) => {
    const colors = ['#C8FF00', '#00F0FF', '#FF6B6B', '#FFB800', '#C8FF00'];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="h2" style={styles.title}>TEMPLATES</ThemedText>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreate(!showCreate)}
        >
          <Ionicons name="add" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Create New */}
        {showCreate && (
          <View style={[styles.createCard, { backgroundColor: colors.card }]}>
            <ThemedText type="h3">NEW TEMPLATE</ThemedText>
            <View style={[styles.createInput, { backgroundColor: colors.background }]}>
              <Ionicons name="create-outline" size={20} color={colors.textMuted} />
              <ThemedText type="default" themeColor="textMuted">Template name...</ThemedText>
            </View>
            <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]}>
              <ThemedText type="smallBold" style={{ color: colors.onPrimary }}>CREATE</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Templates List */}
        <View style={styles.templatesList}>
          {templates.map((template, index) => (
            <TouchableOpacity 
              key={template.id}
              style={[styles.templateCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/workout/templates/${template.id}`)}
            >
              {/* Template Header */}
              <View style={styles.templateHeader}>
                <View style={[styles.templateIcon, { backgroundColor: getTemplateColor(index) + '20' }]}>
                  <Ionicons 
                    name={template.isPreset ? 'star' : 'document-text'} 
                    size={24} 
                    color={getTemplateColor(index)} 
                  />
                </View>
                <View style={styles.templateInfo}>
                  <View style={styles.templateTitleRow}>
                    <ThemedText type="defaultBold">{template.name}</ThemedText>
                    {template.isPreset && (
                      <View style={[styles.presetBadge, { backgroundColor: '#FFB800' + '20' }]}>
                        <ThemedText type="small" style={{ color: '#FFB800' }}>PRESET</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText type="small" themeColor="textMuted">
                    {template.exercises.length} exercises · {template.exercises.reduce((s, e) => s + e.suggestedSets, 0)} sets
                  </ThemedText>
                </View>
              </View>

              {/* Exercise Preview */}
              <View style={[styles.exercisePreview, { backgroundColor: colors.background }]}>
                {template.exercises.slice(0, 3).map((ex) => (
                  <View key={ex.id} style={styles.exerciseItem}>
                    <View style={[styles.exerciseDot, { backgroundColor: getTemplateColor(index) }]} />
                    <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                      {ex.exerciseName}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textMuted">
                      {ex.suggestedSets}×{ex.suggestedReps}
                    </ThemedText>
                  </View>
                ))}
                {template.exercises.length > 3 && (
                  <ThemedText type="small" themeColor="textMuted" style={{ marginLeft: 8 }}>
                    +{template.exercises.length - 3} more
                  </ThemedText>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.startBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleStartFromTemplate(template)}
                >
                  <Ionicons name="play" size={16} color={colors.onPrimary} />
                  <ThemedText type="smallBold" style={{ color: colors.onPrimary }}>START</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.background }]}
                  onPress={() => handleDuplicate(template)}
                >
                  <Ionicons name="copy-outline" size={16} color={colors.text} />
                </TouchableOpacity>
                
                {!template.isPreset && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#FF4757' + '15' }]}
                    onPress={() => handleDelete(template)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF4757" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    letterSpacing: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  createCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    gap: 12,
  },
  createInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  createBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  templatesList: {
    gap: 16,
    paddingBottom: 32,
  },
  templateCard: {
    padding: 20,
    borderRadius: 20,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  templateIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateInfo: {
    flex: 1,
    gap: 4,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  exercisePreview: {
    gap: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
