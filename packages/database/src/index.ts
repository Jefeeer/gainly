// @gainly/database — Supabase client + typed DB access. Schema types owned by G-1 (needs live DB).
// Extensionless relative import is deliberate: our consumers bundle (Next/Turbopack, vitest) and
// Turbopack does NOT map ./client.js -> ./client.ts. A future real Node-ESM consumer (apps/api runs
// `node dist/index.js`) would need this package to ship a build step, not a .js specifier here.
export { createSupabaseClient, resolveSupabaseConfig, type SupabaseConfig } from './client';
