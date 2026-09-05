/**
 * SecureStore adapter for Supabase session persistence (security.md §3).
 * Gracefully handles Expo Go where native SecureStore module isn't available.
 * In demo mode, falls back to in-memory storage.
 */

import type { StorageAdapter } from '@supabase/ssr';

// In-memory fallback for Expo Go (no native SecureStore)
const memoryStore = new Map<string, string>();

let secureStoreAvailable = false;
let SecureStore: typeof import('expo-secure-store') | null = null;

// Try to load SecureStore — fails in Expo Go
try {
  SecureStore = require('expo-secure-store');
  // Test if the native module is actually available
  if (typeof SecureStore?.getItemAsync === 'function') {
    secureStoreAvailable = true;
  }
} catch {
  secureStoreAvailable = false;
}

function logFallback(key: string) {
  if (!secureStoreAvailable) {
    console.log(`[secure-store] Expo Go fallback: using memory for "${key}"`);
  }
}

export const secureStoreAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    logFallback(key);
    if (secureStoreAvailable && SecureStore) {
      return await SecureStore.getItemAsync(key);
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: async (key: string, value: string) => {
    logFallback(key);
    if (secureStoreAvailable && SecureStore) {
      await SecureStore.setItemAsync(key, value);
    } else {
      memoryStore.set(key, value);
    }
  },
  removeItem: async (key: string) => {
    logFallback(key);
    if (secureStoreAvailable && SecureStore) {
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
  if (secureStoreAvailable && SecureStore) {
    await Promise.all([
      SecureStore.deleteItemAsync('sb-access-token').catch(() => {}),
      SecureStore.deleteItemAsync('sb-refresh-token').catch(() => {}),
    ]);
  } else {
    memoryStore.delete('sb-access-token');
    memoryStore.delete('sb-refresh-token');
  }
}
