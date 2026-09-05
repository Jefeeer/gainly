import { useCallback } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/stores/auth';

export default function FirstLaunchScreen() {
  const completeOnboarding = useAuth((s) => s.completeOnboarding);

  const handleStartWorkout = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleChooseTemplate = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="h1" style={styles.title}>
          Ready for your first workout?
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Start from scratch or pick a template to get going.
        </ThemedText>

        <Button label="Start Workout" onPress={handleStartWorkout} />

        <Link href="/(tabs)/workout/templates" asChild>
          <Pressable onPress={handleChooseTemplate}>
            <ThemedText type="link" themeColor="textSecondary">
              Choose a Template
            </ThemedText>
          </Pressable>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
