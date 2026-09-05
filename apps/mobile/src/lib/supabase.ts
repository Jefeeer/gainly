/**
 * Supabase client for the mobile app.
 * Uses SecureStore for session persistence (security.md §3).
 * Reads EXPO_PUBLIC_* env vars — these are safe for client bundles.
 */

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

import { secureStoreAdapter } from './secure-store';

// Expo injects these at build time from app.json → extra → supabase
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  '';

const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

/**
 * Whether the Supabase client is configured with real credentials.
 * When false, auth operations run in "demo mode" — no backend calls.
 */
export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 0 && !supabaseAnonKey.startsWith('eyJ');

/**
 * Supabase client — configured with SecureStore for session persistence.
 * When not configured, the client still exists but auth calls will fail gracefully.
 */
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // React Native doesn't use URL-based auth
  },
});
