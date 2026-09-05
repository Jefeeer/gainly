/**
 * Root layout — auth/onboarding gating per navigation.md §1.
 *
 * "Auth/onboarding gating is done once in app/_layout.tsx:
 *  no session → (auth); session but onboarding_completed_at is null → (onboarding); else (tabs)."
 *
 * Three route groups, selected by a single Redirect based on auth state.
 * SplashScreen handles the initial load; this layout only routes after auth is resolved.
 */

import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AuthProvider } from '@/providers/auth-provider';
import { useAuth } from '@/stores/auth';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);

  useEffect(() => {
    // Hide splash once auth state is resolved (not loading)
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  // Still determining session — keep splash visible
  if (status === 'loading') return null;

  // Unauthenticated → auth stack
  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Authenticated but onboarding not completed → onboarding stack
  if (user && !user.onboardingCompletedAt) {
    return <Redirect href="/(onboarding)/goal" />;
  }

  // Authenticated and onboarded → main app
  return <Redirect href="/(tabs)" />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/active" options={{ headerShown: true, title: 'Active Workout' }} />
        <Stack.Screen name="attribution" options={{ headerShown: true, title: 'Open Source Licenses' }} />
      </Stack>
        </Stack>
      </View>
    </AuthProvider>
  );
}
