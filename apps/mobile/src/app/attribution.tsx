import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

function LicenseLink({ url, children }: { url: string; children: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} accessibilityRole="link" accessibilityLabel={children}>
      <ThemedText type="link" themeColor="text" style={styles.link}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export default function AttributionScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Exercise Artwork Attribution</ThemedText>
        <ThemedText type="default">
          Exercise illustrations are sourced from the Workout Guide project and are licensed under
          Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0).
        </ThemedText>

        <ThemedText type="default">Exercise artwork © 2026 Bryl Lim (bryllim.com), licensed CC BY-SA 4.0.</ThemedText>
        <LicenseLink url="https://creativecommons.org/licenses/by-sa/4.0/">
          View the CC BY-SA 4.0 license
        </LicenseLink>
        <LicenseLink url="https://bryllim.com">bryllim.com</LicenseLink>

        <ThemedText type="default">
          Certain poses adapted from Everkinetic (github.com/everkinetic/data), CC BY-SA 4.0.
        </ThemedText>
        <LicenseLink url="https://github.com/everkinetic/data">github.com/everkinetic/data</LicenseLink>

        <ThemedText type="small" themeColor="textSecondary">
          Changes: frames were rasterized and recolored for monochrome display by the Workout Guide
          project. Gainly applies theme tinting at render time only — the shipped artwork itself is
          unmodified.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  link: {
    textDecorationLine: 'underline',
  },
});
