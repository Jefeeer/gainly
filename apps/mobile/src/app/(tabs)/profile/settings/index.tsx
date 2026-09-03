import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/**
 * Account/Units/Notifications/Privacy/Connected Apps/Theme/Subscription/Help/Logout/Delete
 * Account are real menu items per docs/navigation.md but each needs a signed-in user or a write
 * action - out of scope until auth/data land (G-33 is structure + empty states only). Only About
 * is wired since it's pure static content (the CC BY-SA attribution, G-12).
 */
export default function SettingsScreen() {
  return (
    <Screen>
      <ThemedText type="h1">Settings</ThemedText>
      <Card>
        <Link href="/profile/settings/about" asChild>
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <ThemedText type="default">About</ThemedText>
          </Pressable>
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
});
