import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
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
        <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
          Your progress starts with your first rep.
        </ThemedText>
        <Link href="/attribution" asChild>
          <ThemedText type="link" themeColor="textSecondary" style={styles.attributionLink}>
            About &amp; Open Source Licenses
          </ThemedText>
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
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  mark: {
    width: 160,
    height: 160,
  },
  title: {
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
  },
  attributionLink: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
