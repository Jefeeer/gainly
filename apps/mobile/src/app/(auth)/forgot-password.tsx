import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/stores/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const resetPassword = useAuth((s) => s.resetPassword);
  const authError = useAuth((s) => s.error);
  const clearError = useAuth((s) => s.clearError);

  function validate(): boolean {
    clearError();
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }

  async function handleReset() {
    if (!validate()) return;

    setLoading(true);
    const result = await resetPassword(email.trim());
    setLoading(false);

    if (result.error) {
      // Error shown via authError banner
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Screen centered>
        <ThemedText type="h1">Check Your Email</ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.message}>
          We sent a password reset link to {email}. Check your inbox and follow the link.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="h1">Reset Password</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        Enter your email and we&apos;ll send you a link to reset your password.
      </ThemedText>

      <TextField
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
      />

      {authError ? (
        <ThemedText type="small" themeColor="error">
          {authError}
        </ThemedText>
      ) : null}

      <Button
        label="Send Reset Link"
        onPress={handleReset}
        loading={loading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
});
