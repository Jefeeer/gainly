import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const scheme = useColorScheme();
  const mark =
    scheme === 'dark'
      ? require('@/assets/images/splash-icon-dark.png')
      : require('@/assets/images/splash-icon.png');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Image source={mark} style={styles.mark} contentFit="contain" />
        <ThemedText type="title" style={styles.title}>
          GAINLY
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.tagline}>
          Your progress starts with your first rep.
        </ThemedText>

        <Button label="Get Started" href="/sign-up" />

        <Link href="/sign-in" asChild>
          <Pressable>
            <ThemedText type="link">Sign In</ThemedText>
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
  mark: {
    width: 120,
    height: 120,
  },
  title: {
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
  },
});
