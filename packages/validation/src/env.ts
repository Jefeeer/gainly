import { z } from "zod";

/**
 * Environment variable schema for Gainly (see .env.example / spec §73).
 *
 * Validation is NOT run as an import side-effect. Call `parseEnv()` explicitly
 * at each server/app entrypoint so a misconfigured process fails fast and loud
 * instead of failing deep inside a request.
 *
 * Secrets (SERVICE_ROLE, STRIPE, AI) must only ever be parsed server-side.
 */
export const envSchema = z.object({
  // Client-safe (RLS-gated). Expo/Next only expose the EXPO_PUBLIC_/NEXT_PUBLIC_-prefixed
  // mirrors to bundled code; these unprefixed names are what server code (apps/api) reads.
  SUPABASE_URL: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  // Server-only from here down — never read these outside apps/api.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Session pooler (:5432), not transaction (:6543) — DDL/migrations need it.
  SUPABASE_DB_URL: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  POSTHOG_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.string().min(1).optional(),
  AI_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Parse & validate environment variables, throwing a readable error on failure. */
export function parseEnv(env: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}
