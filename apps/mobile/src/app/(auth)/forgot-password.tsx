import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';

// Submit is intentionally a no-op: Supabase Auth is not wired yet (see sign-in.tsx for why).
function handleReset() {}

export default function ForgotPasswordScreen() {
  return (
    <Screen>
      <ThemedText type="default" themeColor="textSecondary">
        Enter your email and we&apos;ll send you a link to reset your password.
      </ThemedText>
      <TextField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />

      <Button label="Send Reset Link" onPress={handleReset} />
    </Screen>
  );
}
