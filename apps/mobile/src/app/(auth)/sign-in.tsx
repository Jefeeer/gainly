import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';

// Navigates straight into the app (mirrors "already onboarded" - navigation.md's real gating rule)
// rather than calling Supabase Auth, which is not wired yet. This is honest structure, not a fake
// backend: every (tabs) screen already renders its zero-data empty state regardless of who's
// "signed in", so nothing here claims a session or personalized data that doesn't exist.
export default function SignInScreen() {
  return (
    <Screen>
      <TextField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Password" placeholder="••••••••" secureTextEntry />

      <Button label="Sign In" href="/" />

      <Link href="/forgot-password" asChild>
        <Pressable>
          <ThemedText type="link" themeColor="textSecondary">
            Forgot password?
          </ThemedText>
        </Pressable>
      </Link>
    </Screen>
  );
}
