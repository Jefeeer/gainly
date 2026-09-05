/**
 * Root layout — auth/onboarding gating per navigation.md §1.
 *
 * "Auth/onboarding gating is done once in app/_layout.tsx:
 *  no session → (auth); session but onboarding_completed_at is null → (onboarding); else (tabs)."
 */

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/providers/auth-provider';
import { useAuth } from '@/stores/auth';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (status === 'authenticated' && user && !user.onboardingCompletedAt && !inOnboardingGroup) {
      router.replace('/(onboarding)/goal');
    } else if (status === 'authenticated' && user && user.onboardingCompletedAt && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)');
    }
  }, [status, user, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.dark.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/active" options={{ headerShown: true, title: 'Active Workout' }} />
      </Stack>
    </AuthProvider>
  );
}
