/**
 * Fitness Goals — §21: user goals with progress tracking.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBodyMetrics, type UserGoal } from '@/stores/body-metrics';

export default function GoalsScreen() {
  const theme = useTheme();
  const { goals, createGoal, updateGoalProgress, completeGoal, deleteGoal, getActiveGoals } = useBodyMetrics();
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetValue: '', unit: 'kg' });

  const activeGoals = getActiveGoals();
  const completedGoals = goals.filter((g) => g.status === 'completed');

  function handleCreate() {
    if (newGoal.title.trim()) {
      createGoal({
        title: newGoal.title.trim(),
        goalType: 'custom',
        targetValue: parseFloat(newGoal.targetValue) || null,
        unit: newGoal.unit,
        startingValue: null,
        exerciseId: null,
        currentValue: null,
        targetDate: null,
      });
      setNewGoal({ title: '', targetValue: '', unit: 'kg' });
      setShowCreate(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="h1">Goals</ThemedText>
        <Button label="+ New" size="sm" onPress={() => setShowCreate(!showCreate)} />
      </View>

      {/* Create form */}
      {showCreate ? (
        <Card style={styles.createCard}>
          <TextField label="Goal" placeholder="e.g. Reach 80 kg" value={newGoal.title} onChangeText={(v) => setNewGoal((p) => ({ ...p, title: v }))} />
          <TextField label="Target" placeholder="80" keyboardType="numeric" value={newGoal.targetValue} onChangeText={(v) => setNewGoal((p) => ({ ...p, targetValue: v }))} />
          <Button label="Create Goal" size="sm" onPress={handleCreate} />
        </Card>
      ) : null}

      {/* Active goals */}
      {activeGoals.length > 0 ? (
        activeGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onUpdate={updateGoalProgress} onComplete={completeGoal} onDelete={deleteGoal} />
        ))
      ) : null}

      {/* Completed goals */}
      {completedGoals.length > 0 ? (
        <Card>
          <ThemedText type="h3">Completed</ThemedText>
          {completedGoals.map((goal) => (
            <View key={goal.id} style={styles.completedRow}>
              <ThemedText type="default" themeColor="textSecondary">✓ {goal.title}</ThemedText>
            </View>
          ))}
        </Card>
      ) : null}

      {goals.length === 0 && !showCreate ? (
        <EmptyState
          title="No Goals Yet"
          message="Set a fitness goal to track your progress."
          ctaLabel="Create Goal"
          onCtaPress={() => setShowCreate(true)}
        />
      ) : null}
    </Screen>
  );
}

function GoalCard({ goal, onUpdate, onComplete, onDelete }: {
  goal: UserGoal;
  onUpdate: (id: string, value: number) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [updateValue, setUpdateValue] = useState('');
  const progress = goal.targetValue && goal.currentValue != null
    ? Math.min(1, goal.currentValue / goal.targetValue)
    : 0;

  return (
    <Card style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <ThemedText type="h3">{goal.title}</ThemedText>
        <Pressable onPress={() => onDelete(goal.id)}>
          <ThemedText type="small" themeColor="error">×</ThemedText>
        </Pressable>
      </View>
      {goal.targetValue != null ? (
        <ProgressBar value={progress} label={`${goal.currentValue ?? 0} / ${goal.targetValue} ${goal.unit ?? ''}`} />
      ) : null}
      <View style={styles.goalActions}>
        <View style={styles.updateRow}>
          <TextField label="Update" placeholder="Current value" keyboardType="numeric" value={updateValue} onChangeText={setUpdateValue} />
          <Button label="Update" size="sm" onPress={() => {
            const v = parseFloat(updateValue);
            if (!isNaN(v)) { onUpdate(goal.id, v); setUpdateValue(''); }
          }} />
        </View>
        <Button label="Complete" variant="secondary" size="sm" onPress={() => onComplete(goal.id)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  createCard: { gap: Spacing.two },
  goalCard: { gap: Spacing.two },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalActions: { gap: Spacing.two },
  updateRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end' },
  completedRow: { paddingVertical: Spacing.one },
});
