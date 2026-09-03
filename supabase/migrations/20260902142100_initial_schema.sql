-- ============================================================================
-- GAINLY — initial schema migration
-- G-24 (Dwight). Transcribed VERBATIM from the signed-off design:
--   docs/database.md  (schema: tables, constraints, indexes, enums)  — owner: Jan
--   docs/rls.md       (security: RLS policies, functions, triggers, grants, storage)
-- Priority §101: correctness > data integrity > security > ...
--
-- WRITE ONLY — NOT APPLIED. No project/credentials exist (hosted Supabase, empty
-- SUPABASE_DB_URL). Applying is a privileged, human-authorised per-run action.
-- Load-bearing security mechanisms (each fixed under adversarial review) are carried
-- across exactly: G-23 profiles guard (current_user gate), A1 revoke-then-grant,
-- A4 guard_foods_verified, A5 sel_archived_in_history, §8 WG-sync trigger + CHECK, A9 storage.
-- Rollback: ../rollback/20260902142100_initial_schema.down.sql (kept OUT of migrations/
-- so the CLI never auto-runs it).
--
-- Creation order (database.md §1): extensions -> enums -> lookups -> profiles ->
-- is_admin() -> exercises(+children) -> user tables -> templates -> programs ->
-- sessions/sets -> records -> body/nutrition/activity -> subs/devices/health/analytics/
-- audit -> indexes -> functions/triggers -> RLS enable/force -> policies -> grants -> storage.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Extensions (database.md §11)
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- gin_trgm_ops (§58 search)
create extension if not exists unaccent;   -- alias normalization

-- ---------------------------------------------------------------------------
-- 1. Enum types (database.md §2) — only truly fixed, code-coupled sets
-- ---------------------------------------------------------------------------
create type measurement_system    as enum ('metric','imperial');
create type experience_level      as enum ('beginner','intermediate','advanced');
create type fitness_goal          as enum ('build_muscle','lose_weight','get_stronger',
                                           'improve_fitness','maintain_weight','improve_endurance');
create type biological_sex        as enum ('male','female','unspecified');
create type exercise_type         as enum ('weight_reps','reps','duration','distance',
                                           'weight_duration','distance_duration','assisted_weight');
create type set_type              as enum ('warmup','normal','drop','failure','superset');
create type difficulty_level      as enum ('beginner','intermediate','advanced');
create type exercise_source       as enum ('gainly','workout_guide','user','admin','imported');
create type goal_status           as enum ('active','completed','paused','cancelled');
create type pr_type               as enum ('max_weight','max_e1rm','max_reps','max_volume',
                                           'best_distance','best_duration');
create type meal_type             as enum ('breakfast','lunch','dinner','snack');
create type nutrition_goal_mode   as enum ('lose','maintain','gain');
create type subscription_plan     as enum ('free','pro_monthly','pro_annual');
create type subscription_status   as enum ('active','trialing','past_due','canceled','incomplete');
create type subscription_provider as enum ('stripe','apple','google');
create type health_provider       as enum ('apple_health','android_health');
create type template_visibility   as enum ('private','public');
create type program_status        as enum ('draft','active','completed','archived');

-- ---------------------------------------------------------------------------
-- 2. Lookup tables (database.md §3) — public read, admin write
-- ---------------------------------------------------------------------------
create table muscles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  sort_order  int  not null default 0
);

create table equipment (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  sort_order  int  not null default 0
);

create table exercise_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  sort_order  int  not null default 0
);

-- ---------------------------------------------------------------------------
-- 3. profiles (database.md §4.1) — 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  username           text unique,
  display_name       text,
  avatar_url         text,
  date_of_birth      date,
  biological_sex     biological_sex not null default 'unspecified',
  height_cm          numeric(5,2),
  fitness_goal       fitness_goal,
  experience_level   experience_level,
  measurement_system measurement_system not null default 'metric',
  training_days_per_week smallint check (training_days_per_week between 1 and 7),
  is_admin           boolean not null default false,   -- role source of truth; never client-set (§5 L297)
  onboarding_completed_at timestamptz,
  deleted_at         timestamptz,                       -- soft delete / account deletion (§90)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- is_admin() helper (rls.md model §) — reads server-controlled profiles.is_admin only.
-- SECURITY DEFINER + fixed search_path avoids recursive policy on profiles.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- 4. Exercise library (database.md §5). Media/import cols [-> dwight].
-- ---------------------------------------------------------------------------
create table exercises (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null,
  description      text,
  instructions     text,
  exercise_type    exercise_type not null,
  equipment_id     uuid references equipment(id) on delete restrict,
  category_id      uuid references exercise_categories(id) on delete set null,
  difficulty       difficulty_level,
  image_url        text,
  local_asset_key  text,
  video_url        text,
  source           exercise_source not null default 'gainly',
  external_source  text,
  external_id      text,
  external_slug    text,
  asset_provider   text,
  asset_key        text,
  asset_frame_count int,                                -- WG frames constant 3 (Dwight G-3); null otherwise
  is_custom        boolean not null default false,
  is_active        boolean not null default true,
  created_by       uuid references profiles(id) on delete set null,  -- null = system/library
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint exercises_slug_scope_unique unique nulls not distinct (slug, created_by),
  constraint exercises_external_unique   unique (external_source, external_slug)
);

-- G-14 / rls.md §8 — always-on, unbypassable INSERT+UPDATE guard: a workout_guide row is a
-- global library row, so source='workout_guide' => created_by IS NULL (Oscar A3 INSERT hole).
alter table exercises
  add constraint exercises_wg_source_is_library
  check (source <> 'workout_guide' or created_by is null);

create table exercise_muscles (
  exercise_id uuid not null references exercises(id) on delete cascade,
  muscle_id   uuid not null references muscles(id)   on delete restrict,
  role        text not null default 'primary' check (role in ('primary','secondary')),
  primary key (exercise_id, muscle_id)
);

create table exercise_aliases (
  id               uuid primary key default gen_random_uuid(),
  exercise_id      uuid not null references exercises(id) on delete cascade,
  alias            text not null,
  normalized_alias text not null,
  created_at       timestamptz not null default now(),
  unique (exercise_id, normalized_alias)
);

create table exercise_favorites (
  user_id     uuid not null references profiles(id)  on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

-- ---------------------------------------------------------------------------
-- 5. Remaining core user tables (database.md §4.2, §4.3)
-- ---------------------------------------------------------------------------
create table user_settings (
  user_id            uuid primary key references profiles(id) on delete cascade,
  theme              text not null default 'system' check (theme in ('system','light','dark')),
  weight_unit        text not null default 'kg'  check (weight_unit in ('kg','lb')),
  distance_unit      text not null default 'km'  check (distance_unit in ('km','miles')),
  measurement_unit   text not null default 'cm'  check (measurement_unit in ('cm','inches')),
  volume_unit        text not null default 'ml'  check (volume_unit in ('ml','fl_oz')),
  default_rest_seconds int not null default 90,
  auto_start_rest_timer boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table user_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  title          text not null,
  goal_type      text not null,                    -- body_weight|lift|frequency|body_fat|distance|custom
  exercise_id    uuid references exercises(id) on delete set null,
  starting_value numeric,
  target_value   numeric,
  current_value  numeric,
  unit           text,
  target_date    date,
  status         goal_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz
);

-- ---------------------------------------------------------------------------
-- 6. Templates & programs (database.md §6)
-- ---------------------------------------------------------------------------
create table workout_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  description text,
  visibility  template_visibility not null default 'private',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table workout_template_exercises (
  id                uuid primary key default gen_random_uuid(),
  template_id       uuid not null references workout_templates(id) on delete cascade,
  exercise_id       uuid not null references exercises(id) on delete restrict,
  position          int  not null,
  suggested_sets    int,
  suggested_reps    int,
  suggested_weight  numeric,
  rest_seconds      int,
  notes             text,
  unique (template_id, position)
);

create table programs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  name          text not null,
  description   text,
  duration_weeks int,
  start_date    date,
  status        program_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table program_weeks (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs(id) on delete cascade,
  week_number int not null,
  unique (program_id, week_number)
);

create table program_days (
  id              uuid primary key default gen_random_uuid(),
  program_week_id uuid not null references program_weeks(id) on delete cascade,
  day_of_week     smallint not null check (day_of_week between 1 and 7),  -- Mon=1
  is_rest_day     boolean not null default false,
  label           text,
  unique (program_week_id, day_of_week)
);

create table program_workouts (
  id             uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references program_days(id) on delete cascade,
  template_id    uuid not null references workout_templates(id) on delete restrict,
  position       int not null default 0,
  progression_note text,
  unique (program_day_id, template_id)
);

-- ---------------------------------------------------------------------------
-- 7. Workout tracking (database.md §7) — MVP core
-- ---------------------------------------------------------------------------
create table workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  template_id   uuid references workout_templates(id) on delete set null,
  program_day_id uuid references program_days(id) on delete set null,
  name          text,
  status        text not null default 'active' check (status in ('active','completed','discarded')),
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  notes         text,
  duration_seconds int,
  total_sets    int,
  completed_sets int,
  total_reps    int,
  total_volume  numeric,
  client_uuid   uuid,                                  -- offline idempotency key (Dwight D1)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint workout_sessions_client_uuid_unique unique (user_id, client_uuid)
);

create table workout_session_exercises (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references workout_sessions(id) on delete cascade,
  exercise_id   uuid not null references exercises(id) on delete restrict, -- restrict: history keeps archived (§87)
  position      int not null,
  notes         text,
  client_uuid   uuid,                                  -- offline idempotency key (Dwight D2)
  created_at    timestamptz not null default now(),
  unique (session_id, position),
  unique (session_id, client_uuid)                     -- stable replay key ((session_id,position) mutates on reorder)
);

create table workout_sets (
  id            uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references workout_session_exercises(id) on delete cascade,
  set_number    int not null,                          -- CLIENT-ASSIGNED, retry-stable; server upserts ON CONFLICT (Dwight)
  set_type      set_type not null default 'normal',
  weight        numeric check (weight is null or weight >= 0),
  reps          int     check (reps   is null or reps   >= 0),
  duration_seconds int  check (duration_seconds is null or duration_seconds >= 0),
  distance      numeric check (distance is null or distance >= 0),
  rpe           numeric(3,1),
  is_completed  boolean not null default false,
  completed_at  timestamptz,
  client_uuid   uuid,                                  -- trace id; replay key is (session_exercise_id,set_number)
  created_at    timestamptz not null default now(),
  unique (session_exercise_id, set_number)
);

create table personal_records (                        -- §16 auto-detected (service layer)
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  exercise_id   uuid not null references exercises(id) on delete restrict,  -- G-30: restrict (not cascade) — a PR must not vanish when an exercise row is deleted; matches workout_session_exercises.exercise_id (history keeps archived exercises)
  pr_type       pr_type not null,
  value         numeric not null,
  reps          int,                                   -- rep count (value for max_reps); context for weight/e1RM
  weight        numeric,                               -- bucket weight for max_reps (per-weight, Dwight D-c); NULL = bodyweight
  achieved_at   timestamptz not null default now(),
  workout_set_id uuid references workout_sets(id) on delete set null,
  created_at    timestamptz not null default now()
);
-- D4 (Dwight): stop a retried finish from double-inserting the same PR. Partial (workout_set_id nullable).
create unique index pr_dedupe_by_set on personal_records (workout_set_id, pr_type)
  where workout_set_id is not null;

-- ---------------------------------------------------------------------------
-- 8. Body, nutrition, activity (database.md §8)
-- ---------------------------------------------------------------------------
create table body_measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  body_fat_pct numeric(4,1),
  waist_cm    numeric(5,2), chest_cm numeric(5,2), arms_cm numeric(5,2),
  thighs_cm   numeric(5,2), hips_cm  numeric(5,2), neck_cm numeric(5,2),
  created_at  timestamptz not null default now()
);

create table weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  weight_kg   numeric(6,2) not null,
  recorded_at timestamptz not null default now(),
  source      text not null default 'manual',
  created_at  timestamptz not null default now()
);

create table nutrition_goals (
  user_id        uuid primary key references profiles(id) on delete cascade,
  mode           nutrition_goal_mode,
  calorie_goal   int,
  protein_g      int, carbs_g int, fat_g int, fiber_g int,
  water_ml_goal  int,
  is_estimated   boolean not null default false,
  updated_at     timestamptz not null default now()
);

create table foods (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  brand         text,
  serving_size  numeric, serving_unit text,
  calories      numeric, protein_g numeric, carbs_g numeric, fat_g numeric, fiber_g numeric,
  external_provider text,
  external_id   text,
  created_by    uuid references profiles(id) on delete set null,  -- null = catalog; set = custom
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now()
);

create table meals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  log_date    date not null,
  meal_type   meal_type not null,
  created_at  timestamptz not null default now(),
  unique (user_id, log_date, meal_type)
);

create table food_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade, -- denormalized for RLS/index
  meal_id     uuid not null references meals(id) on delete cascade,
  food_id     uuid references foods(id) on delete set null,
  food_name   text,                                     -- snapshot (survives food edits/deletes)
  quantity    numeric not null default 1,
  serving     text,
  calories    numeric, protein_g numeric, carbs_g numeric, fat_g numeric, fiber_g numeric,
  logged_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table water_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  amount_ml   int not null,
  logged_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table daily_activity (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  activity_date date not null,
  steps         int, active_calories numeric, distance_m numeric, active_minutes int,
  source        text not null default 'manual',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, activity_date)
);

-- ---------------------------------------------------------------------------
-- 9. Subscriptions, devices, health, analytics, audit (database.md §9)
-- ---------------------------------------------------------------------------
create table subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  provider              subscription_provider not null,
  provider_customer_id  text,
  provider_subscription_id text,
  plan                  subscription_plan not null default 'free',
  status                subscription_status not null default 'active',
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id)
);

create table notification_preferences (
  user_id            uuid primary key references profiles(id) on delete cascade,
  workout_reminders  boolean not null default true,
  rest_timer         boolean not null default true,
  streak_reminders   boolean not null default true,
  weekly_summary     boolean not null default true,
  goal_milestones    boolean not null default true,
  program_reminders  boolean not null default true,
  updated_at         timestamptz not null default now()
);

create table device_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  token       text not null,
  platform    text not null check (platform in ('ios','android')),
  created_at  timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (token)
);

create table health_connections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  provider    health_provider not null,
  is_enabled  boolean not null default true,
  scopes      text[] not null default '{}',
  last_synced_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, provider)
);

create table analytics_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete set null,  -- nullable: pre-auth
  event       text not null,
  properties  jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create table admin_audit_logs (
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references profiles(id) on delete set null,
  action        text not null,
  resource_type text not null,
  resource_id   uuid,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. Indexes (database.md §11) — 1:1 with api.md read paths, no speculative
-- ---------------------------------------------------------------------------
create index idx_sessions_user_started        on workout_sessions(user_id, started_at desc);
create index idx_session_exercises_session    on workout_session_exercises(session_id);
create index idx_sets_session_exercise         on workout_sets(session_exercise_id);
create index idx_weight_logs_user_recorded    on weight_logs(user_id, recorded_at desc);
create index idx_food_logs_user_logged        on food_logs(user_id, logged_at desc);
create index idx_meals_user_date              on meals(user_id, log_date);
create index idx_daily_activity_user_date     on daily_activity(user_id, activity_date desc);
create index idx_prs_user_exercise            on personal_records(user_id, exercise_id);
create index idx_aliases_normalized           on exercise_aliases(normalized_alias);
create index idx_exercises_active             on exercises(is_active) where is_active;
create index idx_exercises_name_trgm          on exercises using gin (name gin_trgm_ops);
create index idx_exercise_muscles_muscle      on exercise_muscles(muscle_id);
create index idx_body_measurements_user_time  on body_measurements(user_id, recorded_at desc);
create index idx_user_goals_user_status       on user_goals(user_id, status);

-- ---------------------------------------------------------------------------
-- 11. Functions & triggers (database.md §10, rls.md §1/§3/§8)
-- ---------------------------------------------------------------------------

-- 11.1 updated_at (database.md §10)
create or replace function set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger trg_profiles_updated               before update on profiles               for each row execute function set_updated_at();
create trigger trg_user_settings_updated          before update on user_settings          for each row execute function set_updated_at();
create trigger trg_user_goals_updated             before update on user_goals             for each row execute function set_updated_at();
create trigger trg_exercises_updated              before update on exercises              for each row execute function set_updated_at();
create trigger trg_workout_templates_updated      before update on workout_templates      for each row execute function set_updated_at();
create trigger trg_programs_updated               before update on programs               for each row execute function set_updated_at();
create trigger trg_workout_sessions_updated       before update on workout_sessions       for each row execute function set_updated_at();
create trigger trg_nutrition_goals_updated        before update on nutrition_goals        for each row execute function set_updated_at();
create trigger trg_subscriptions_updated          before update on subscriptions          for each row execute function set_updated_at();
create trigger trg_notification_preferences_updated before update on notification_preferences for each row execute function set_updated_at();
create trigger trg_daily_activity_updated         before update on daily_activity         for each row execute function set_updated_at();

-- 11.2 profiles privileged-column guard (rls.md §1, A1 + G-23).
-- G-23: gate on current_user='authenticated', NOT a bare not is_admin() — under service_role
-- auth.uid() is NULL so is_admin() is always false; a bare guard would BLOCK the very writes it
-- exists to permit (soft-delete, admin promotion, first-admin bootstrap). Not security definer,
-- so current_user is the calling role.
create or replace function guard_profiles_privileged_cols() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' and not is_admin() then
    if new.is_admin   is distinct from old.is_admin   then
      raise exception 'is_admin is not self-writable';
    end if;
    if new.deleted_at is distinct from old.deleted_at then
      raise exception 'deleted_at is not self-writable';
    end if;
  end if;
  return new;
end $$;
create trigger trg_guard_profiles_privileged before update on profiles
  for each row execute function guard_profiles_privileged_cols();

-- 11.3 foods is_verified guard (rls.md §3, A4). Blocks non-admin is_verified INSERT/transition
-- while still letting a user edit other fields of an admin-verified food.
create or replace function guard_foods_verified() returns trigger
language plpgsql as $$
begin
  if not is_admin() then
    if tg_op = 'INSERT' and coalesce(new.is_verified, false) then
      raise exception 'is_verified may only be set by an admin';
    elsif tg_op = 'UPDATE' and new.is_verified is distinct from old.is_verified then
      raise exception 'is_verified transitions are admin-only';
    end if;
  end if;
  return new;
end $$;
create trigger trg_guard_foods_verified before insert or update on foods
  for each row execute function guard_foods_verified();

-- 11.4 Workout Guide sync-scope trigger (rls.md §8, Dwight G-14). Fires for ALL roles
-- (service_role bypasses RLS, so a policy can't). Guard 1: source immutable on UPDATE for every
-- actor (kills source-flip hijack). Guard 2: flag-gated import scope. Explicit returns (never
-- coalesce composite records — a NULL return from a BEFORE row trigger silently cancels the write).
create or replace function enforce_wg_sync_scope() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.source is distinct from old.source then
    raise exception 'exercises.source is immutable (attempted % -> %)',
      old.source, new.source;
  end if;

  if current_setting('app.import_context', true) = 'workout_guide' then
    if tg_op = 'DELETE' then
      if old.source is distinct from 'workout_guide' then
        raise exception 'WG sync may only delete source=workout_guide rows (attempted source=%)',
          old.source;
      end if;
    else  -- INSERT or UPDATE
      if new.source is distinct from 'workout_guide' then
        raise exception 'WG sync may only write source=workout_guide rows (attempted source=%)',
          new.source;
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;
create trigger trg_wg_sync_scope
  before insert or update or delete on exercises
  for each row execute function enforce_wg_sync_scope();

-- ---------------------------------------------------------------------------
-- 12. RLS: enable + FORCE on every application table (rls.md model §)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'muscles','equipment','exercise_categories',
    'profiles','user_settings','user_goals',
    'exercises','exercise_muscles','exercise_aliases','exercise_favorites',
    'workout_templates','workout_template_exercises',
    'programs','program_weeks','program_days','program_workouts',
    'workout_sessions','workout_session_exercises','workout_sets','personal_records',
    'body_measurements','weight_logs','nutrition_goals','foods','meals','food_logs',
    'water_logs','daily_activity',
    'subscriptions','notification_preferences','device_tokens','health_connections',
    'analytics_events','admin_audit_logs'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force  row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 13. RLS policies
-- ---------------------------------------------------------------------------

-- 13.1 Owner-only tables (rls.md §1). Generic (user_id = auth.uid()).
create policy sel_own on user_settings for select using (user_id = auth.uid());
create policy ins_own on user_settings for insert with check (user_id = auth.uid());
create policy upd_own on user_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on user_settings for delete using (user_id = auth.uid());

create policy sel_own on user_goals for select using (user_id = auth.uid());
create policy ins_own on user_goals for insert with check (user_id = auth.uid());
create policy upd_own on user_goals for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on user_goals for delete using (user_id = auth.uid());

create policy sel_own on nutrition_goals for select using (user_id = auth.uid());
create policy ins_own on nutrition_goals for insert with check (user_id = auth.uid());
create policy upd_own on nutrition_goals for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on nutrition_goals for delete using (user_id = auth.uid());

create policy sel_own on notification_preferences for select using (user_id = auth.uid());
create policy ins_own on notification_preferences for insert with check (user_id = auth.uid());
create policy upd_own on notification_preferences for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on notification_preferences for delete using (user_id = auth.uid());

create policy sel_own on body_measurements for select using (user_id = auth.uid());
create policy ins_own on body_measurements for insert with check (user_id = auth.uid());
create policy upd_own on body_measurements for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on body_measurements for delete using (user_id = auth.uid());

create policy sel_own on weight_logs for select using (user_id = auth.uid());
create policy ins_own on weight_logs for insert with check (user_id = auth.uid());
create policy upd_own on weight_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on weight_logs for delete using (user_id = auth.uid());

create policy sel_own on water_logs for select using (user_id = auth.uid());
create policy ins_own on water_logs for insert with check (user_id = auth.uid());
create policy upd_own on water_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on water_logs for delete using (user_id = auth.uid());

create policy sel_own on daily_activity for select using (user_id = auth.uid());
create policy ins_own on daily_activity for insert with check (user_id = auth.uid());
create policy upd_own on daily_activity for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on daily_activity for delete using (user_id = auth.uid());

create policy sel_own on meals for select using (user_id = auth.uid());
create policy ins_own on meals for insert with check (user_id = auth.uid());
create policy upd_own on meals for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on meals for delete using (user_id = auth.uid());

create policy sel_own on food_logs for select using (user_id = auth.uid());
create policy ins_own on food_logs for insert with check (user_id = auth.uid());
create policy upd_own on food_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on food_logs for delete using (user_id = auth.uid());

create policy sel_own on exercise_favorites for select using (user_id = auth.uid());
create policy ins_own on exercise_favorites for insert with check (user_id = auth.uid());
create policy upd_own on exercise_favorites for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on exercise_favorites for delete using (user_id = auth.uid());

create policy sel_own on device_tokens for select using (user_id = auth.uid());
create policy ins_own on device_tokens for insert with check (user_id = auth.uid());
create policy upd_own on device_tokens for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on device_tokens for delete using (user_id = auth.uid());

create policy sel_own on health_connections for select using (user_id = auth.uid());
create policy ins_own on health_connections for insert with check (user_id = auth.uid());
create policy upd_own on health_connections for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on health_connections for delete using (user_id = auth.uid());

create policy sel_own on workout_sessions for select using (user_id = auth.uid());
create policy ins_own on workout_sessions for insert with check (user_id = auth.uid());
create policy upd_own on workout_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on workout_sessions for delete using (user_id = auth.uid());

-- personal_records is §5 WRITE-RESTRICTED (RULED G-26; rls.md:303/:308, database.md:231/:622).
-- SELECT-own only; ZERO insert/update/delete policies -> default-deny IS the enforcement. The
-- service role (PersonalRecordService on workout finish) bypasses RLS and is the sole writer.
-- Same shape as subscriptions / analytics_events / admin_audit_logs. Do NOT add a permissive write
-- policy with a restrictive `with check` "to be explicit" — any write policy converts default-deny
-- into an evaluated one and reopens the fabrication + LWW-precedence bug class. Absence is stronger.
-- No column grant and no trigger: the ABSENCE of write policies is the mechanism.
create policy sel_own on personal_records for select using (user_id = auth.uid());

create policy sel_own on programs for select using (user_id = auth.uid());
create policy ins_own on programs for insert with check (user_id = auth.uid());
create policy upd_own on programs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on programs for delete using (user_id = auth.uid());

-- profiles (rls.md §1) — PK id = auth.uid(); soft-deleted rows invisible.
create policy sel_self on profiles for select using (id = auth.uid() and deleted_at is null);
create policy upd_self on profiles for update using (id = auth.uid() and deleted_at is null)
                                        with check (id = auth.uid());
-- INSERT: signup trigger / service role only (no client insert policy).

-- workout_templates (rls.md §1 owner + §3 dormant public read)
create policy sel_own on workout_templates for select using (user_id = auth.uid());
create policy ins_own on workout_templates for insert with check (user_id = auth.uid());
create policy upd_own on workout_templates for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy del_own on workout_templates for delete using (user_id = auth.uid());
create policy sel_public_template on workout_templates for select using (visibility = 'public'); -- dormant (MVP: all private)

-- 13.2 Child tables (rls.md §2) — authorize via parent's owner; both using + with check.
create policy own_via_session on workout_session_exercises for all
using (exists (select 1 from workout_sessions s
               where s.id = session_id and s.user_id = auth.uid()))
with check (exists (select 1 from workout_sessions s
               where s.id = session_id and s.user_id = auth.uid()));

create policy own_via_session on workout_sets for all
using (exists (select 1 from workout_session_exercises se
               join workout_sessions s on s.id = se.session_id
               where se.id = session_exercise_id and s.user_id = auth.uid()))
with check (exists (select 1 from workout_session_exercises se
               join workout_sessions s on s.id = se.session_id
               where se.id = session_exercise_id and s.user_id = auth.uid()));

create policy own_via_template on workout_template_exercises for all
using (exists (select 1 from workout_templates t
               where t.id = template_id and t.user_id = auth.uid()))
with check (exists (select 1 from workout_templates t
               where t.id = template_id and t.user_id = auth.uid()));

create policy own_via_program on program_weeks for all
using (exists (select 1 from programs p
               where p.id = program_id and p.user_id = auth.uid()))
with check (exists (select 1 from programs p
               where p.id = program_id and p.user_id = auth.uid()));

create policy own_via_program on program_days for all
using (exists (select 1 from program_weeks w join programs p on p.id = w.program_id
               where w.id = program_week_id and p.user_id = auth.uid()))
with check (exists (select 1 from program_weeks w join programs p on p.id = w.program_id
               where w.id = program_week_id and p.user_id = auth.uid()));

create policy own_via_program on program_workouts for all
using (exists (select 1 from program_days d
               join program_weeks w on w.id = d.program_week_id
               join programs p on p.id = w.program_id
               where d.id = program_day_id and p.user_id = auth.uid()))
with check (exists (select 1 from program_days d
               join program_weeks w on w.id = d.program_week_id
               join programs p on p.id = w.program_id
               where d.id = program_day_id and p.user_id = auth.uid()));

-- 13.3 Shared content (rls.md §3)
create policy sel_active_public on exercises for select
  using (is_active and created_by is null);
create policy sel_own_custom on exercises for select
  using (created_by = auth.uid());
create policy ins_own_custom on exercises for insert
  with check (created_by = auth.uid() and is_custom);
create policy upd_own_custom on exercises for update
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy admin_all on exercises for all
  using (is_admin()) with check (is_admin());
-- A5 v2 (Oscar G-21): archived GLOBAL exercise readable inside own history; scoped to
-- created_by is null (kills the IDOR of injecting another user's custom exercise_id).
create policy sel_archived_in_history on exercises for select
  using (exercises.created_by is null
     and not exercises.is_active
     and exists (select 1 from workout_session_exercises se
                 join workout_sessions s on s.id = se.session_id
                 where se.exercise_id = exercises.id and s.user_id = auth.uid()));

create policy sel_public on exercise_aliases for select
  using (exists (select 1 from exercises e where e.id = exercise_id
                 and ((e.is_active and e.created_by is null) or e.created_by = auth.uid())));
create policy write_via_owner on exercise_aliases for all
  using (exists (select 1 from exercises e where e.id = exercise_id
                 and (e.created_by = auth.uid() or is_admin())))
  with check (exists (select 1 from exercises e where e.id = exercise_id
                 and (e.created_by = auth.uid() or is_admin())));

create policy sel_public on exercise_muscles for select
  using (exists (select 1 from exercises e where e.id = exercise_id
                 and ((e.is_active and e.created_by is null) or e.created_by = auth.uid())));
create policy write_via_owner on exercise_muscles for all
  using (exists (select 1 from exercises e where e.id = exercise_id
                 and (e.created_by = auth.uid() or is_admin())))
  with check (exists (select 1 from exercises e where e.id = exercise_id
                 and (e.created_by = auth.uid() or is_admin())));

create policy sel_catalog_or_own on foods for select
  using (created_by is null or is_verified or created_by = auth.uid());
create policy ins_own on foods for insert with check (created_by = auth.uid());
create policy upd_own on foods for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy admin_all on foods for all using (is_admin()) with check (is_admin());

-- 13.4 Lookups (rls.md §4) — public read, admin write
create policy sel_all on muscles for select using (true);
create policy admin_write on muscles for all using (is_admin()) with check (is_admin());
create policy sel_all on equipment for select using (true);
create policy admin_write on equipment for all using (is_admin()) with check (is_admin());
create policy sel_all on exercise_categories for select using (true);
create policy admin_write on exercise_categories for all using (is_admin()) with check (is_admin());

-- 13.5 Write-restricted (rls.md §5)
create policy ins_own on analytics_events for insert
  with check (user_id = auth.uid() or user_id is null);
-- (no select policy -> clients cannot read)

create policy sel_admin on admin_audit_logs for select using (is_admin());
-- (no insert policy -> service role only)

create policy sel_own on subscriptions for select using (user_id = auth.uid());
-- A2 (Oscar G-17 CRITICAL): no ins/upd/del policy -> all writes via Stripe webhook / service role.

-- ---------------------------------------------------------------------------
-- 14. profiles column privileges (rls.md §1, A1) — revoke-then-grant allow-list.
-- FAIL CLOSED: revoke ALL update, then grant only user-editable columns, so any future
-- privileged column is non-writable by users until explicitly granted.
-- ---------------------------------------------------------------------------
revoke update on profiles from authenticated;
grant  update (username, display_name, avatar_url, date_of_birth, biological_sex, height_cm,
               fitness_goal, experience_level, measurement_system, training_days_per_week,
               onboarding_completed_at)
  on profiles to authenticated;
-- is_admin, deleted_at, id, created_at, updated_at intentionally NOT granted -> service-role only.

-- ---------------------------------------------------------------------------
-- 14b. G-30 — server-authoritative columns/tables locked to service-role. Column privileges are
-- an INDEPENDENT gate from RLS (see profiles A1): Supabase grants insert/update/delete to
-- `authenticated` on every new public table by default, so a permissive write policy added later
-- would ride on that grant. We close that second gate here. Fail-closed revoke-then-grant so a
-- future column is non-writable until explicitly granted. Revoke from `authenticated` and `anon`
-- ONLY — NEVER `service_role`/`public`: bypassrls does NOT bypass GRANTS, so a public revoke would
-- break every server-side write and present as an RLS bug.

-- workout_sessions: the five cached aggregates (duration_seconds, total_sets, completed_sets,
-- total_reps, total_volume) are computed server-side on finish; users own the rest of the row.
revoke update on workout_sessions from authenticated;
grant  update (name, notes, status, started_at, ended_at, template_id, program_day_id, client_uuid)
  on workout_sessions to authenticated;
-- 5 cached metrics + user_id/id/created_at/updated_at NOT granted -> service-role (finish job) only.

-- health_connections: last_synced_at (sync job) and scopes (provider-granted, least-privilege) are
-- not the user's to assert. UPDATE: only is_enabled. INSERT: only user_id (RLS ins_own needs it),
-- provider, is_enabled — scopes/last_synced_at fall to their defaults ('{}' / null) and are then
-- written by the service-role sync job.
revoke update on health_connections from authenticated;
grant  update (is_enabled) on health_connections to authenticated;
revoke insert on health_connections from authenticated;
grant  insert (user_id, provider, is_enabled) on health_connections to authenticated;

-- Per-operation revokes on fully server-authoritative write surfaces, DERIVED from each table's
-- actual policy set (not a table list): revoke exactly the write ops that have NO permissive policy.
-- SELECT grants are left intact so the read policies still work.
revoke insert, update, delete on personal_records from authenticated, anon;  -- policies: {sel_own}. Sole writer = PersonalRecordService (service role).
revoke insert, update, delete on subscriptions     from authenticated, anon;  -- policies: {sel_own}. Sole writer = Stripe webhook (service role).
revoke update, delete          on analytics_events  from authenticated, anon;  -- policies: {ins_own INSERT}. KEEP insert — revoking it would kill client telemetry.
revoke insert, update, delete on admin_audit_logs  from authenticated, anon;  -- policies: {sel_admin SELECT}. Rows written by service role only.

-- ---------------------------------------------------------------------------
-- 15. Storage buckets + policies (rls.md §6, A9). Buckets created idempotently so the
-- policies below have a target; owner = first path segment (key objects as <uid>/file).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('avatars','avatars',false),
  ('exercise-media','exercise-media',true),
  ('progress-photos','progress-photos',false)
on conflict (id) do nothing;

-- avatars: read/write only within your own {uid}/ prefix (A9 — with check on insert AND update)
create policy avatars_sel on storage.objects for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_ins on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_upd on storage.objects for update
  using      (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_del on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- progress-photos (future): identical owner-only shape (rls.md §6).
create policy progress_photos_sel on storage.objects for select
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy progress_photos_ins on storage.objects for insert
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy progress_photos_upd on storage.objects for update
  using      (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy progress_photos_del on storage.objects for delete
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- exercise-media: public read (illustrations); write admin-only [-> dwight for asset flow].
create policy exercise_media_sel on storage.objects for select
  using (bucket_id = 'exercise-media');
create policy exercise_media_ins on storage.objects for insert
  with check (bucket_id = 'exercise-media' and is_admin());
create policy exercise_media_upd on storage.objects for update
  using      (bucket_id = 'exercise-media' and is_admin())
  with check (bucket_id = 'exercise-media' and is_admin());
create policy exercise_media_del on storage.objects for delete
  using (bucket_id = 'exercise-media' and is_admin());

commit;
