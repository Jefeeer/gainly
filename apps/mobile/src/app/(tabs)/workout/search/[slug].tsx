import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { workoutGuideProvider, type FrameIndex } from '@gainly/exercises';

export default function ExerciseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const [currentFrame, setCurrentFrame] = useState<FrameIndex>(1);

  const exercise = useMemo(() => {
    if (!slug) return null;
    return workoutGuideProvider.get(slug);
  }, [slug]);

  if (!exercise) {
    return (
      <Screen centered>
        <ThemedText type="h3">Exercise Not Found</ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          This exercise could not be loaded.
        </ThemedText>
      </Screen>
    );
  }

  const frameUrl = workoutGuideProvider.assetUrl(exercise.slug, currentFrame);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Exercise illustration — 3-frame animation */}
        <View style={styles.illustrationContainer}>
          {frameUrl ? (
            <Image
              source={{ uri: frameUrl }}
              style={styles.illustration}
              contentFit="contain"
              transition={200}
              tintColor={theme.text} // CC BY-SA 4.0: tint at render time, never pre-bake
            />
          ) : (
            <View style={[styles.illustration, styles.fallback]}>
              <ThemedText type="h3" themeColor="textSecondary">
                No illustration
              </ThemedText>
            </View>
          )}
        </View>

        {/* Frame indicator dots */}
        <View style={styles.frameDots}>
          {[1, 2, 3].map((frame) => (
            <View
              key={frame}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    frame === currentFrame ? theme.primary : theme.backgroundElement,
                },
              ]}
            />
          ))}
        </View>

        {/* Exercise name */}
        <ThemedText type="h1" style={styles.name}>
          {exercise.name}
        </ThemedText>

        {/* Tags */}
        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              {exercise.primaryMuscle}
            </ThemedText>
          </View>
          <View style={[styles.tag, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              {exercise.equipment}
            </ThemedText>
          </View>
          <View style={[styles.tag, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              {exercise.exerciseType.replace('_', ' + ')}
            </ThemedText>
          </View>
        </View>

        {/* Instructions — §6: exercise detail empty state for missing content */}
        <Card>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Instructions
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            Instructions for this exercise are not yet available. This content will be added
            in a future update.
          </ThemedText>
        </Card>

        {/* Previous performance placeholder */}
        <Card>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Previous Performance
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            Complete a workout with this exercise to see your history here.
          </ThemedText>
        </Card>

        {/* Add to workout CTA */}
        <Button label="Add to Workout" href="/workout/active" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  illustrationContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  illustration: {
    width: 200,
    height: 200,
  },
  fallback: {
    backgroundColor: '#F0F2EF',
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  tag: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
});
