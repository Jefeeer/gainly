import { Alert, Linking, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/stores/auth';

/**
 * Settings screen — account, units, notifications, privacy, etc.
 * Per navigation.md §4: "About" is wired (CC BY-SA attribution); others need auth.
 */
export default function SettingsScreen() {
  const signOut = useAuth((s) => s.signOut);
  const user = useAuth((s) => s.user);
  const isDemoMode = useAuth((s) => s.isDemoMode);

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  }

  return (
    <Screen>
      <ThemedText type="h1">Settings</ThemedText>

      {/* Account info */}
      {user ? (
        <Card>
          <ThemedText type="small" themeColor="textSecondary">
            Signed in as
          </ThemedText>
          <ThemedText type="bodyStrong">
            {user.displayName ?? user.email ?? 'Unknown'}
          </ThemedText>
          {isDemoMode ? (
            <ThemedText type="small" themeColor="textMuted">
              Demo Mode
            </ThemedText>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Link href="/(tabs)/profile/settings/about" asChild>
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <ThemedText type="default">About Gainly</ThemedText>
          </Pressable>
        </Link>
      </Card>

      <Card>
        <Link href="/attribution" asChild>
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <ThemedText type="default">Open Source Licenses</ThemedText>
          </Pressable>
        </Link>
      </Card>

      {/* Logout */}
      <Button
        label="Sign Out"
        variant="destructive"
        onPress={handleLogout}
      />
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
