/**
 * SecureStore adapter for Supabase session persistence (security.md §3).
 * Gracefully handles Expo Go where native SecureStore module isn't available.
 * In demo mode, falls back to in-memory storage.
 */

import type { StorageAdapter } from '@supabase/ssr';

// In-memory fallback for Expo Go (no native SecureStore)
const memoryStore = new Map<string, string>();

let SecureStore: typeof import('expo-secure-store') | null = null;
let probePromise: Promise<boolean> | null = null;

function probeNative(): Promise<boolean> {
  if (probePromise) return probePromise;
  probePromise = (async () => {
    try {
      SecureStore = require('expo-secure-store');
      // Probe by calling getItemAsync — if native module is missing, this throws
      await SecureStore.getItemAsync('__probe__');
      return true;
    } catch {
      SecureStore = null;
      return false;
    }
  })();
  return probePromise;
}

export const secureStoreAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    if (await probeNative() && SecureStore) {
      return await SecureStore.getItemAsync(key);
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: async (key: string, value: string) => {
    if (await probeNative() && SecureStore) {
      await SecureStore.setItemAsync(key, value);
    } else {
      memoryStore.set(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (await probeNative() && SecureStore) {
      await SecureStore.deleteItemAsync(key);
    } else {
      memoryStore.delete(key);
    }
  },
};

/**
 * Clear all auth tokens (used on logout).
 */
export async function clearAuthTokens(): Promise<void> {
  if (await probeNative() && SecureStore) {
    await Promise.all([
      SecureStore.deleteItemAsync('sb-access-token').catch(() => {}),
      SecureStore.deleteItemAsync('sb-refresh-token').catch(() => {}),
    ]);
  } else {
    memoryStore.delete('sb-access-token');
    memoryStore.delete('sb-refresh-token');
  }
}
