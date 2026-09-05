/**
 * AuthProvider — initializes auth on launch and provides session state.
 * Wraps the app at the root layout level.
 *
 * navigation.md §1: "Auth/onboarding gating is done once in app/_layout.tsx"
 * This provider runs that initialization and exposes the state.
 */

import { type ReactNode, useEffect } from 'react';

import { useAuth } from '@/stores/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialize = useAuth((s) => s.initialize);
  const status = useAuth((s) => s.status);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // The provider always renders children — the root layout uses the auth status
  // to decide which route group to show. We don't block on loading here because
  // SplashScreen handles the initial load state.
  return <>{children}</>;
}
