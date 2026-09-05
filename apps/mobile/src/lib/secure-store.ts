/**
 * SecureStore adapter for Supabase session persistence (security.md §3).
 * Auth tokens go in Keychain/Keystore-backed SecureStore, never AsyncStorage.
 * Draft workout data stays in SQLite/MMKV — separate concern.
 */

import * as SecureStore from 'expo-secure-store';

import type { StorageAdapter } from '@supabase/ssr';

const EXPO_KEYS = {
  accessToken: 'sb-access-token',
  refreshToken: 'sb-refresh-token',
};

export const secureStoreAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    const value = await SecureStore.getItemAsync(key);
    return value;
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Clear all auth tokens from SecureStore (used on logout).
 */
export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(EXPO_KEYS.accessToken).catch(() => {}),
    SecureStore.deleteItemAsync(EXPO_KEYS.refreshToken).catch(() => {}),
  ]);
}
