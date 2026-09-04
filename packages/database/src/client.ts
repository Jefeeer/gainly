// @gainly/database — the ONE Supabase client for the app. Reads client-safe env vars only and
// fails LOUD and EARLY on anything missing or wrong-shaped, so a misconfig surfaces here with a
// named, actionable error instead of later as a confusing `undefined` auth failure.
//
// SECURITY: this module is client-imported (web/admin/mobile), so it reads ONLY the publishable
// anon key. The service-role / secret key must never reach this path; a secret value in the anon
// var is rejected rather than used.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

type EnvSource = Record<string, string | undefined>;

// Resolution order per runtime: web/admin inject NEXT_PUBLIC_*, mobile injects EXPO_PUBLIC_*, and
// Node/tests may use the bare vars. First non-empty wins.
const URL_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'] as const;
const ANON_KEYS = [
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
] as const;

// globalThis.process avoids a hard @types/node dependency and is safe in a browser/RN bundle where
// `process` is absent.
function defaultEnv(): EnvSource {
  return (globalThis as { process?: { env?: EnvSource } }).process?.env ?? {};
}

function firstNonEmpty(env: EnvSource, names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = env[name];
    if (value !== undefined && value.trim() !== '') return value.trim();
  }
  return undefined;
}

// Pure, network-free. Throws a named Error on any invalid config; returns the validated pair.
export function resolveSupabaseConfig(env: EnvSource = defaultEnv()): SupabaseConfig {
  const url = firstNonEmpty(env, URL_KEYS);
  const anonKey = firstNonEmpty(env, ANON_KEYS);

  if (!url) {
    throw new Error(
      `[@gainly/database] Missing Supabase URL. Set one of ${URL_KEYS.join(', ')} in .env.local.`,
    );
  }
  if (!anonKey) {
    throw new Error(
      `[@gainly/database] Missing Supabase anon key. Set one of ${ANON_KEYS.join(', ')} in .env.local.`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `[@gainly/database] Malformed Supabase URL: ${JSON.stringify(url)} is not a valid URL.`,
    );
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(
      `[@gainly/database] Supabase URL must use https, got "${parsed.protocol}". Value: ${url}`,
    );
  }

  // Legacy JWT keys (eyJ...) were disabled on this project — reject with a message that says so,
  // so the next person gets the answer, not a silent auth failure.
  if (anonKey.startsWith('eyJ')) {
    throw new Error(
      `[@gainly/database] Legacy JWT anon key detected (starts with "eyJ"). The project's legacy ` +
        `API keys are DISABLED — use the current publishable key (sb_publishable_...).`,
    );
  }
  // A secret key must never be used from a client-imported module.
  if (anonKey.startsWith('sb_secret_')) {
    throw new Error(
      `[@gainly/database] A secret key (sb_secret_...) must never be used in the client module. ` +
        `Use the publishable anon key (sb_publishable_...).`,
    );
  }
  if (!anonKey.startsWith('sb_publishable_')) {
    throw new Error(
      `[@gainly/database] Supabase anon key looks malformed. Expected a publishable key starting ` +
        `with "sb_publishable_".`,
    );
  }

  return { url, anonKey };
}

// The client factory. Validation runs first, so an invalid config throws before any client exists.
export function createSupabaseClient(env: EnvSource = defaultEnv()): SupabaseClient {
  const { url, anonKey } = resolveSupabaseConfig(env);
  return createClient(url, anonKey);
}
