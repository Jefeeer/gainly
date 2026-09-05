/**
 * Auth store — manages session state, user info, and loading.
 * Supports both real Supabase auth and demo mode when keys are unavailable.
 *
 * security.md §3: tokens in SecureStore; this store holds the in-memory session state
 * that the rest of the app reads. The actual token persistence is handled by the
 * Supabase client's SecureStore adapter.
 */

import { create } from 'zustand';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { clearAuthTokens } from '@/lib/secure-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  onboardingCompletedAt: string | null;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  isDemoMode: boolean;
  error: string | null;
}

export interface AuthActions {
  /** Initialize auth — called on app launch to restore session. */
  initialize: () => Promise<void>;

  /** Sign up with email/password. */
  signUp: (payload: { email: string; password: string }) => Promise<{ error?: string }>;

  /** Sign in with email/password. */
  signIn: (payload: { email: string; password: string }) => Promise<{ error?: string }>;

  /** Sign in with Google OAuth. */
  signInWithGoogle: () => Promise<{ error?: string }>;

  /** Sign in with Apple. */
  signInWithApple: () => Promise<{ error?: string }>;

  /** Send password reset email. */
  resetPassword: (email: string) => Promise<{ error?: string }>;

  /** Sign out. */
  signOut: () => Promise<void>;

  /** Demo mode: simulate sign-in without a backend. */
  demoSignIn: () => void;

  /** Mark onboarding as completed. */
  completeOnboarding: () => void;

  /** Update user profile fields. */
  updateProfile: (updates: Partial<Pick<AuthUser, 'displayName' | 'avatarUrl'>>) => void;

  /** Clear any auth error. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Demo user for offline/testing mode
// ---------------------------------------------------------------------------

const DEMO_USER: AuthUser = {
  id: 'demo-user-000',
  email: 'demo@gainly.app',
  displayName: 'Demo User',
  avatarUrl: null,
  isAdmin: false,
  onboardingCompletedAt: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type AuthStore = AuthState & AuthActions;

export const useAuth = create<AuthStore>((set, get) => ({
  // State
  status: 'loading',
  user: null,
  isDemoMode: !isSupabaseConfigured,
  error: null,

  // Actions
  initialize: async () => {
    if (!isSupabaseConfigured) {
      // Demo mode: no real auth, start unauthenticated
      set({ status: 'unauthenticated', isDemoMode: true });
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('[auth] getSession error:', error.message);
        set({ status: 'unauthenticated', error: error.message });
        return;
      }

      if (session?.user) {
        const user = mapSupabaseUser(session.user);
        set({ status: 'authenticated', user });
      } else {
        set({ status: 'unauthenticated' });
      }
    } catch (err) {
      console.warn('[auth] initialize error:', err);
      set({ status: 'unauthenticated' });
    }
  },

  signUp: async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      get().demoSignIn();
      return {};
    }

    set({ status: 'loading', error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      set({ status: 'unauthenticated', error: error.message });
      return { error: error.message };
    }

    if (data.user) {
      const user = mapSupabaseUser(data.user);
      set({ status: 'authenticated', user });
    }
    return {};
  },

  signIn: async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      get().demoSignIn();
      return {};
    }

    set({ status: 'loading', error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      set({ status: 'unauthenticated', error: error.message });
      return { error: error.message };
    }

    if (data.user) {
      const user = mapSupabaseUser(data.user);
      set({ status: 'authenticated', user });
    }
    return {};
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) {
      get().demoSignIn();
      return {};
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'gainly://callback' },
    });

    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    return {};
  },

  signInWithApple: async () => {
    if (!isSupabaseConfigured) {
      get().demoSignIn();
      return {};
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: 'gainly://callback' },
    });

    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    return {};
  },

  resetPassword: async (email) => {
    if (!isSupabaseConfigured) {
      return {};
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'gainly://reset-password',
    });

    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    return {};
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    await clearAuthTokens();
    set({ status: 'unauthenticated', user: null, error: null });
  },

  demoSignIn: () => {
    set({
      status: 'authenticated',
      user: { ...DEMO_USER },
      isDemoMode: true,
      error: null,
    });
  },

  completeOnboarding: () => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, onboardingCompletedAt: new Date().toISOString() } });
    }
  },

  updateProfile: (updates) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapSupabaseUser(supabaseUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AuthUser {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? null,
    displayName: (meta.display_name as string) ?? (meta.full_name as string) ?? null,
    avatarUrl: (meta.avatar_url as string) ?? null,
    isAdmin: false, // server-controlled via profiles.is_admin; never trust client
    onboardingCompletedAt: null, // loaded from profiles table, not JWT
  };
}
