import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/stores/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const signIn = useAuth((s) => s.signIn);
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle);
  const signInWithApple = useAuth((s) => s.signInWithApple);
  const authError = useAuth((s) => s.error);
  const clearError = useAuth((s) => s.clearError);
  const isDemoMode = useAuth((s) => s.isDemoMode);
  const demoSignIn = useAuth((s) => s.demoSignIn);

  function validate(): boolean {
    const newErrors: typeof errors = {};
    clearError();

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignIn() {
    if (!validate()) return;

    setLoading(true);
    const result = await signIn({ email: email.trim(), password });
    setLoading(false);

    if (result.error) {
      Alert.alert('Sign In Failed', result.error);
    }
    // On success, auth state changes → root layout redirects to (tabs) or (onboarding)
  }

  async function handleGoogleSignIn() {
    const result = await signInWithGoogle();
    if (result.error) {
      Alert.alert('Google Sign In Failed', result.error);
    }
  }

  async function handleAppleSignIn() {
    const result = await signInWithApple();
    if (result.error) {
      Alert.alert('Apple Sign In Failed', result.error);
    }
  }

  return (
    <Screen>
      <ThemedText type="h1">Welcome Back</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        Sign in to continue your progress.
      </ThemedText>

      <TextField
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />

      <TextField
        label="Password"
        placeholder="••••••••"
        secureTextEntry
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      {authError ? (
        <View style={styles.errorBanner}>
          <ThemedText type="small" themeColor="error">
            {authError}
          </ThemedText>
        </View>
      ) : null}

      <Button
        label="Sign In"
        onPress={handleSignIn}
        loading={loading}
      />

      {/* OAuth buttons */}
      <View style={styles.oauthRow}>
        <Button
          label="Google"
          variant="outline"
          onPress={handleGoogleSignIn}
        />
        <Button
          label="Apple"
          variant="outline"
          onPress={handleAppleSignIn}
        />
      </View>

      {/* Demo mode shortcut */}
      {isDemoMode ? (
        <Button
          label="Try Demo Mode"
          variant="secondary"
          onPress={demoSignIn}
        />
      ) : null}

      <Link href="/(auth)/forgot-password" asChild>
        <Pressable>
          <ThemedText type="link" themeColor="textSecondary" style={styles.forgot}>
            Forgot password?
          </ThemedText>
        </Pressable>
      </Link>

      <Link href="/(auth)/sign-up" asChild>
        <Pressable>
          <ThemedText type="link" themeColor="textSecondary" style={styles.switchAuth}>
            Don&apos;t have an account? Sign Up
          </ThemedText>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#FEE2E2',
  },
  oauthRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  forgot: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  switchAuth: {
    textAlign: 'center',
    marginTop: Spacing.one,
  },
});
