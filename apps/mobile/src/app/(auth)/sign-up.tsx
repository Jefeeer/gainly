import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/stores/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

  const signUp = useAuth((s) => s.signUp);
  const authError = useAuth((s) => s.error);
  const clearError = useAuth((s) => s.clearError);

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
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignUp() {
    if (!validate()) return;

    setLoading(true);
    const result = await signUp({ email: email.trim(), password });
    setLoading(false);

    if (result.error) {
      Alert.alert('Sign Up Failed', result.error);
    }
    // On success, auth state changes → root layout redirects to (onboarding)
  }

  return (
    <Screen>
      <ThemedText type="h1">Create Account</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        Start tracking your fitness journey.
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
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <TextField
        label="Confirm Password"
        placeholder="••••••••"
        secureTextEntry
        autoComplete="new-password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirm}
      />

      {authError ? (
        <View style={styles.errorBanner}>
          <ThemedText type="small" themeColor="error">
            {authError}
          </ThemedText>
        </View>
      ) : null}

      <Button
        label="Create Account"
        onPress={handleSignUp}
        loading={loading}
      />

      <Link href="/(auth)/sign-in" asChild>
        <ThemedText type="link" themeColor="textSecondary" style={styles.switchAuth}>
          Already have an account? Sign In
        </ThemedText>
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
  switchAuth: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
});
