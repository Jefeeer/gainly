// G-47 (Dwight): validation contract for the Supabase client module. Tests the PURE config
// resolver — no network, no DB, no mocked database. The point of the card is that a missing or
// wrong-shaped env var fails LOUD and EARLY with a named, actionable error instead of surfacing
// later as a confusing `undefined` auth failure.
import { describe, expect, it } from 'vitest';
import { resolveSupabaseConfig } from './client.js';

// Public, non-secret fixtures. The project ref is public (docs); the key is an obvious fake that
// only has to match the sb_publishable_ shape — never a real key value in a fixture.
const URL_OK = 'https://ammtkgqkoahylbqfamsa.supabase.co';
const KEY_OK = 'sb_publishable_THIS_IS_A_FAKE_TEST_KEY_000';

describe('resolveSupabaseConfig — fail loud & early (G-47)', () => {
  it('resolves url + anonKey from NEXT_PUBLIC_ vars (happy path)', () => {
    expect(
      resolveSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: URL_OK,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: KEY_OK,
      }),
    ).toEqual({ url: URL_OK, anonKey: KEY_OK });
  });

  it('also resolves from EXPO_PUBLIC_ vars (mobile)', () => {
    expect(
      resolveSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: URL_OK,
        EXPO_PUBLIC_SUPABASE_ANON_KEY: KEY_OK,
      }).url,
    ).toBe(URL_OK);
  });

  it('throws a named error when the URL is missing', () => {
    expect(() => resolveSupabaseConfig({ NEXT_PUBLIC_SUPABASE_ANON_KEY: KEY_OK })).toThrow(
      /Missing Supabase URL/,
    );
  });

  it('throws a named error when the anon key is missing', () => {
    expect(() => resolveSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL_OK })).toThrow(
      /Missing Supabase anon key/,
    );
  });

  it('rejects a malformed URL', () => {
    expect(() =>
      resolveSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: KEY_OK,
      }),
    ).toThrow(/Malformed Supabase URL|must use https/);
  });

  it('rejects a legacy JWT (eyJ) key, saying legacy keys are disabled', () => {
    expect(() =>
      resolveSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: URL_OK,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiJ9.FAKE.legacy',
      }),
    ).toThrow(/legacy[\s\S]*disabled/i);
  });

  it('rejects a secret key reaching the client module', () => {
    expect(() =>
      resolveSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: URL_OK,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_secret_FAKE',
      }),
    ).toThrow(/secret key/i);
  });

  it('rejects an anon key that is not a publishable key', () => {
    expect(() =>
      resolveSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: URL_OK,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'garbage',
      }),
    ).toThrow(/publishable/i);
  });
});
