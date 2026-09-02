-- Gainly RLS pgTAP fixtures (Angela G-25).
-- WRITE-ONLY as of authoring — do NOT run against the hosted project without god's per-run
-- authorization (docs/testing.md, rls.md). Loaded before every numbered test file (pg_prove
-- runs supabase/tests/rls/*.sql in lexical order; 000_ sorts first).
--
-- Not wrapped in begin/rollback: the functions/schema here must persist for the other test
-- files' own transactions to call. Each numbered test file rolls back its own data.

create extension if not exists pgtap;

create schema if not exists tests;

-- Seed a minimal, valid auth.users + public.profiles pair. There is no Auth API to call from
-- SQL, so a direct auth.users insert is the standard pgTAP-for-Supabase pattern. `id` is the
-- only column this schema requires NOT NULL beyond Supabase's own defaults; the rest below are
-- populated because various Supabase internals (GoTrue triggers, if any exist in this project)
-- are more forgiving with them present. If the hosted project's auth.users has stricter
-- constraints than this, this is the one block to adjust first.
create or replace function tests.create_user(p_id uuid, p_email text, p_is_admin boolean default false)
returns void
language plpgsql
as $$
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                           email_confirmed_at, created_at, updated_at, raw_app_meta_data,
                           raw_user_meta_data)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          p_email, 'not-a-real-hash-test-only', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
  on conflict (id) do nothing;

  insert into public.profiles (id, username, is_admin)
  values (p_id, p_email, p_is_admin)
  on conflict (id) do nothing;
end;
$$;

-- Switch the pgTAP session to look like a PostgREST request authenticated as p_id — this is
-- what auth.uid() and every RLS policy in rls.md actually reads.
create or replace function tests.authenticate_as(p_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id::text, 'role', 'authenticated')::text, true);
end;
$$;

create or replace function tests.authenticate_as_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{}', true);
end;
$$;

-- service_role has BYPASSRLS in every Supabase project (granted outside this migration, as
-- part of Supabase's own project bootstrap) — this is the actual production mechanism the
-- Stripe webhook / account-deletion job / WG importer use, so tests must exercise it directly
-- rather than assume it behaves like a permissive RLS policy.
create or replace function tests.authenticate_as_service_role()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'service_role', true);
  perform set_config('request.jwt.claims', '{}', true);
end;
$$;
