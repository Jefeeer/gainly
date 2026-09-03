import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';

// Navigates to onboarding rather than calling Supabase Auth (see sign-in.tsx for why this is
// honest structure, not a fake backend).
export default function SignUpScreen() {
  return (
    <Screen>
      <TextField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Password" placeholder="••••••••" secureTextEntry />
      <TextField label="Confirm Password" placeholder="••••••••" secureTextEntry />

      <Button label="Create Account" href="/goal" />
    </Screen>
  );
}
