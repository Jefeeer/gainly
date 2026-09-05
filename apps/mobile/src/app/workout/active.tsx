/**
 * Active Workout screen — §9, the highest-priority feature (§79 L2651).
 * Full-screen route outside the tab stack (navigation.md §3).
 * backed by Zustand store (offline.md Layer A).
 *
 * Features: add/remove/reorder exercises, sets, set types, previous performance,
 * rest timer, notes, finish workout.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { RestTimer } from '@/components/rest-timer';
import { SetRow } from '@/components/set-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useActiveWorkout, type ActiveExercise } from '@/stores/active-workout';

export default function ActiveWorkoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    hasActiveWorkout,
    exercises,
    startedAt,
    restTimer,
    startWorkout,
    discardWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    completeSet,
    startRestTimer,
    stopRestTimer,
    tickRestTimer,
    addTimeToRestTimer,
  } = useActiveWorkout();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start a workout if none active
  useEffect(() => {
    if (!hasActiveWorkout) {
      startWorkout();
    }
  }, [hasActiveWorkout, startWorkout]);

  // Elapsed time counter
  useEffect(() => {
    if (hasActiveWorkout && startedAt) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasActiveWorkout, startedAt]);

  // Rest timer tick
  useEffect(() => {
    if (restTimer.isRunning) {
      const interval = setInterval(() => tickRestTimer(), 1000);
      return () => clearInterval(interval);
    }
  }, [restTimer.isRunning, tickRestTimer]);

  const handleFinish = useCallback(() => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.isCompleted).length,
      0,
    );

    Alert.alert(
      'Finish Workout',
      `${exercises.length} exercises, ${completedSets}/${totalSets} sets completed`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            // In production: sync to server, compute metrics, detect PRs
            discardWorkout();
            router.replace('/(tabs)');
          },
        },
      ],
    );
  }, [exercises, discardWorkout, router]);

  const handleDiscard = useCallback(() => {
    Alert.alert('Discard Workout', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          discardWorkout();
          router.replace('/(tabs)');
        },
      },
    ]);
  }, [discardWorkout, router]);

  // Demo: add a placeholder exercise
  const handleAddExercise = useCallback(() => {
    // In production: open exercise picker modal
    addExercise({
      exerciseId: `exercise-${Date.now()}`,
      exerciseName: `Exercise ${exercises.length + 1}`,
    });
    // Auto-add first set
    const exId = useActiveWorkout.getState().exercises.slice(-1)[0]?.id;
    if (exId) {
      addSet({ exerciseClientId: exId });
      addSet({ exerciseClientId: exId });
      addSet({ exerciseClientId: exId });
    }
  }, [addExercise, addSet, exercises.length]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleDiscard} style={styles.headerButton}>
            <ThemedText type="small" themeColor="error">Cancel</ThemedText>
          </Pressable>
          <ThemedText type="metricSm" style={styles.timer}>
            {formatTime(elapsedSeconds)}
          </ThemedText>
          <Pressable onPress={handleFinish} style={styles.headerButton}>
            <ThemedText type="smallBold" themeColor="primary">Finish</ThemedText>
          </Pressable>
        </View>

        {/* Rest Timer Overlay */}
        <RestTimer
          isRunning={restTimer.isRunning}
          remainingSeconds={restTimer.remainingSeconds}
          totalSeconds={restTimer.totalSeconds}
          onSkip={stopRestTimer}
          onAddTime={addTimeToRestTimer}
        />

        {/* Exercises */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {exercises.length === 0 ? (
            <EmptyState
              title="No Exercises Yet"
              message="Add an exercise to start logging sets."
              ctaLabel="Add Exercise"
              onCtaPress={handleAddExercise}
            />
          ) : (
            exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onAddSet={() => addSet({ exerciseClientId: exercise.id })}
                onUpdateSet={(setId, updates) =>
                  updateSet({ exerciseClientId: exercise.id, setClientId: setId, ...updates })
                }
                onCompleteSet={(setId) => {
                  completeSet({ exerciseClientId: exercise.id, setClientId: setId });
                  // Start rest timer after completing a set
                  startRestTimer({ seconds: 90, exerciseId: exercise.exerciseId });
                }}
                onRemoveExercise={() => removeExercise(exercise.id)}
                theme={theme}
              />
            ))
          )}
        </ScrollView>

        {/* Add Exercise Button */}
        {exercises.length > 0 ? (
          <View style={styles.bottomBar}>
            <Button label="Add Exercise" variant="secondary" onPress={handleAddExercise} />
          </View>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// ExerciseCard sub-component
// ---------------------------------------------------------------------------

function ExerciseCard({
  exercise,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onRemoveExercise,
  theme,
}: {
  exercise: ActiveExercise;
  onAddSet: () => void;
  onUpdateSet: (setId: string, updates: { weight?: number | null; reps?: number | null }) => void;
  onCompleteSet: (setId: string) => void;
  onRemoveExercise: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Card style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <ThemedText type="h3" style={styles.exerciseName}>
          {exercise.exerciseName}
        </ThemedText>
        <Pressable onPress={onRemoveExercise}>
          <ThemedText type="small" themeColor="error">Remove</ThemedText>
        </Pressable>
      </View>

      {/* Set header row */}
      <View style={styles.setHeader}>
        <ThemedText type="small" themeColor="textMuted" style={styles.setHeaderText}>Set</ThemedText>
        <ThemedText type="small" themeColor="textMuted" style={styles.setHeaderPrevious}>Prev</ThemedText>
        <ThemedText type="small" themeColor="textMuted" style={styles.setHeaderInput}>kg</ThemedText>
        <ThemedText type="small" themeColor="textMuted" style={styles.setHeaderInput}>reps</ThemedText>
        <View style={styles.setHeaderCheck} />
      </View>

      {/* Sets */}
      {exercise.sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          onUpdate={(updates) => onUpdateSet(set.id, updates)}
          onComplete={() => onCompleteSet(set.id)}
        />
      ))}

      {/* Add Set */}
      <Pressable onPress={onAddSet} style={styles.addSetButton}>
        <ThemedText type="smallBold" themeColor="primary">+ Add Set</ThemedText>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontVariant: ['tabular-nums'],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  exerciseCard: {
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
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  setHeaderText: { width: 32, textAlign: 'center' },
  setHeaderPrevious: { width: 60, textAlign: 'center' },
  setHeaderInput: { flex: 1, textAlign: 'center' },
  setHeaderCheck: { width: 32 },
  addSetButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    minHeight: 44,
    justifyContent: 'center',
  },
  bottomBar: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
});
