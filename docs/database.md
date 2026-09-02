# Gainly — Database ERD & Schema (`database.md`)

Owner: Jan (architecture). Covers §103 items 3–4. Sources: §13 (L563), §16 (L1298),
§21 (L1385), §22–26, §33 (L1610), §35 (L1677), §43 (L1839), §87 (L2888), §88 (L2896),
§89 (L2906), §95 (L3019). Priority order §101: **correctness > data integrity > security**.

Postgres via Supabase. All PKs are `uuid default gen_random_uuid()`. All timestamps are
`timestamptz` stored UTC (§88). Every user-owned table carries `user_id uuid` → `profiles.id`
so RLS (`rls.md`) can gate on `auth.uid()`. Exercise/media/import columns that belong to
Dwight's Workout Guide plan (§13A) are marked `[→ dwight]` — the columns live here (single
schema) but their semantics/import logic are specified in Dwight's `workout-guide-integration.md`
and `exercise-mapping.md`.

---

## 1. ERD (logical)

```text
auth.users(1)───(1)profiles
  profiles(1)──(1)user_settings
  profiles(1)──(1)nutrition_goals
  profiles(1)──(*)user_goals
  profiles(1)──(*)notification_preferences   (1 row/user; kept as table per §33)
  profiles(1)──(*)device_tokens
  profiles(1)──(*)health_connections
  profiles(1)──(0..1)subscriptions
  profiles(1)──(*)body_measurements
  profiles(1)──(*)weight_logs
  profiles(1)──(*)daily_activity
  profiles(1)──(*)water_logs

equipment(1)──(*)exercises
exercise_categories(1)──(*)exercises
muscles(1)──(*)exercise_muscles(*)──(1)exercises
exercises(1)──(*)exercise_aliases
profiles(1)──(*)exercise_favorites(*)──(1)exercises
profiles(0..1 created_by)──(*)exercises          (custom exercises §13, L627)

profiles(1)──(*)workout_templates(1)──(*)workout_template_exercises(*)──(1)exercises

profiles(1)──(*)programs(1)──(*)program_weeks(1)──(*)program_days(1)──(*)program_workouts(*)──(1)workout_templates

profiles(1)──(*)workout_sessions(1)──(*)workout_session_exercises(1)──(*)workout_sets
  workout_sessions(*)──(0..1)workout_templates   (started from template)
  workout_sessions(*)──(0..1)program_days        (came from a program day)
  workout_session_exercises(*)──(1)exercises
profiles(1)──(*)personal_records(*)──(1)exercises
  personal_records(*)──(0..1)workout_sets        (the set that set the PR)

profiles(1)──(*)meals(1)──(*)food_logs(*)──(0..1)foods
  foods(*)──(0..1 created_by)profiles            (custom foods §23, L1451)

profiles(*)──(0..1)analytics_events              (nullable: pre-auth events)
profiles(admin)(1)──(*)admin_audit_logs
```

Junctions: `exercise_muscles`, `workout_template_exercises`, `workout_session_exercises`,
`program_workouts`, `exercise_favorites`. No cycles — the FK graph is a DAG rooted at
`profiles`/lookups.

**Migration creation order** (so every FK target pre-exists): extensions → enums → lookups
(`muscles`,`equipment`,`exercise_categories`) → `profiles` → `exercises` (+`exercise_muscles`,
`exercise_aliases`,`exercise_favorites`) → `user_settings`,`nutrition_goals`,`user_goals`
(`user_goals.exercise_id` needs `exercises` first — hence exercises precedes it despite the
grouped presentation below) → templates → programs → sessions/sets → records → body/nutrition/
activity → subscriptions/devices/health/analytics/audit. The §4–9 grouping below is *logical*,
not the migration order.

---

## 2. Enum types

Enums are used only for **truly fixed, code-coupled** sets. Muscles, equipment, and categories
are **lookup tables** (they need seeding §66 and admin management §41), not enums.

```sql
create type measurement_system as enum ('metric','imperial');
create type experience_level   as enum ('beginner','intermediate','advanced');
create type fitness_goal       as enum ('build_muscle','lose_weight','get_stronger',
                                        'improve_fitness','maintain_weight','improve_endurance');
create type biological_sex     as enum ('male','female','unspecified');
create type exercise_type      as enum ('weight_reps','reps','duration','distance',
                                        'weight_duration','distance_duration','assisted_weight'); -- §11
create type set_type           as enum ('warmup','normal','drop','failure','superset');          -- §10, extensible via new label
create type difficulty_level   as enum ('beginner','intermediate','advanced');
create type exercise_source    as enum ('gainly','workout_guide','user');                        -- §13A [→ dwight]
create type goal_status        as enum ('active','completed','paused','cancelled');              -- §21
create type pr_type            as enum ('max_weight','max_e1rm','max_reps','max_volume',
                                        'best_distance','best_duration');                        -- §16
create type meal_type          as enum ('breakfast','lunch','dinner','snack');                   -- §23
create type nutrition_goal_mode as enum ('lose','maintain','gain');                              -- §6 screen 6 / §25
create type subscription_plan  as enum ('free','pro_monthly','pro_annual');                      -- §43
create type subscription_status as enum ('active','trialing','past_due','canceled','incomplete');
create type subscription_provider as enum ('stripe','apple','google');                           -- §43
create type health_provider    as enum ('apple_health','android_health');                        -- §27/§28
create type template_visibility as enum ('private','public');                                    -- MVP: private only
create type program_status     as enum ('draft','active','completed','archived');
```

`set_type` covers §10's five values; §10 asks the architecture to "allow additional types
later". Adding an enum label is a one-line non-breaking migration, so an enum is acceptable;
if churn is expected, promote to a `set_types` lookup (noted as upgrade path).

---

## 3. Lookup tables (seeded — §66 L2295)

```sql
create table muscles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,          -- Chest, Back, ... Other (§13 L593)
  slug        text not null unique,
  sort_order  int  not null default 0
);

create table equipment (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,          -- Barbell, Dumbbell, ... Other (§13 L612)
  slug        text not null unique,
  sort_order  int  not null default 0
);

create table exercise_categories (            -- §41 admin manages categories, §66 seed
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  sort_order  int  not null default 0
);
```

RLS stance: **public read, admin write** (see `rls.md §Lookups`).

---

## 4. Core user tables

```sql
-- 4.1 profiles — 1:1 with auth.users (§5, §29)
create table profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  username           text unique,
  display_name       text,
  avatar_url         text,                         -- Supabase Storage key (§184)
  date_of_birth      date,                         -- §6 screen 4; DOB not age (§88)
  biological_sex     biological_sex not null default 'unspecified', -- §6: only for calorie calc
  height_cm          numeric(5,2),                 -- normalized metric store (§89 L2924)
  fitness_goal       fitness_goal,                 -- §6 screen 2
  experience_level   experience_level,             -- §6 screen 3
  measurement_system measurement_system not null default 'metric', -- §6 screen 4
  training_days_per_week smallint check (training_days_per_week between 1 and 7), -- §6 screen 5
  is_admin           boolean not null default false, -- role source of truth; never client-set (§5 L297)
  onboarding_completed_at timestamptz,
  deleted_at         timestamptz,                  -- soft delete / account deletion (§90 L2938)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 4.2 user_settings — 1:1 (§30, §31 theme, §89 units)
create table user_settings (
  user_id            uuid primary key references profiles(id) on delete cascade,
  theme              text not null default 'system' check (theme in ('system','light','dark')), -- §31
  weight_unit        text not null default 'kg'  check (weight_unit in ('kg','lb')),   -- §89
  distance_unit      text not null default 'km'  check (distance_unit in ('km','miles')),
  measurement_unit   text not null default 'cm'  check (measurement_unit in ('cm','inches')),
  volume_unit        text not null default 'ml'  check (volume_unit in ('ml','fl_oz')),
  default_rest_seconds int not null default 90,   -- §12
  auto_start_rest_timer boolean not null default true, -- §12 L551
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 4.3 user_goals — fitness goals (§21). (§33 name: user_goals)
create table user_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  title          text not null,                    -- §21 fields
  goal_type      text not null,                    -- 'body_weight'|'lift'|'frequency'|'body_fat'|'distance'|'custom'
  exercise_id    uuid references exercises(id) on delete set null, -- for lift goals
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
```

---

## 5. Exercise library (§13, §13A)

```sql
-- 5.1 exercises — canonical Gainly library (§13 L563). Media/import cols [→ dwight].
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
  -- media / provenance (§13A) [→ dwight] --------------------------------------
  image_url        text,
  local_asset_key  text,
  video_url        text,
  source           exercise_source not null default 'gainly',
  external_source  text,                            -- e.g. 'workout-guide'
  external_id      text,
  external_slug    text,
  asset_provider   text,
  asset_key        text,
  asset_frame_count int,
  -- ownership / lifecycle ------------------------------------------------------
  is_custom        boolean not null default false,  -- §13 L627 custom exercises
  is_active        boolean not null default true,   -- §87 soft delete / archive
  created_by       uuid references profiles(id) on delete set null, -- null = system
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- global library slug unique; each user's custom slugs unique to them
  constraint exercises_slug_scope_unique unique nulls not distinct (slug, created_by)
);

-- 5.2 exercise_muscles — junction, primary+secondary (§13 L593, §33)
create table exercise_muscles (
  exercise_id uuid not null references exercises(id) on delete cascade,
  muscle_id   uuid not null references muscles(id)   on delete restrict,
  role        text not null default 'primary' check (role in ('primary','secondary')),
  primary key (exercise_id, muscle_id)
);

-- 5.3 exercise_aliases (§13A L1019) — search includes aliases
create table exercise_aliases (
  id               uuid primary key default gen_random_uuid(),
  exercise_id      uuid not null references exercises(id) on delete cascade,
  alias            text not null,
  normalized_alias text not null,                   -- lower/trim/unaccent for search
  created_at       timestamptz not null default now(),
  unique (exercise_id, normalized_alias)
);

-- 5.4 exercise_favorites (§59)
create table exercise_favorites (
  user_id     uuid not null references profiles(id)  on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, exercise_id)
);
```

---

## 6. Templates & programs (§14, §15)

```sql
create table workout_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,                        -- §14
  description text,
  visibility  template_visibility not null default 'private',
  is_active   boolean not null default true,        -- soft delete
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table workout_template_exercises (
  id                uuid primary key default gen_random_uuid(),
  template_id       uuid not null references workout_templates(id) on delete cascade,
  exercise_id       uuid not null references exercises(id) on delete restrict,
  position          int  not null,                  -- §14 exercise order
  suggested_sets    int,
  suggested_reps    int,
  suggested_weight  numeric,
  rest_seconds      int,
  notes             text,
  unique (template_id, position)
);

create table programs (                              -- §15
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
  id         uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  week_number int not null,
  unique (program_id, week_number)
);

create table program_days (
  id            uuid primary key default gen_random_uuid(),
  program_week_id uuid not null references program_weeks(id) on delete cascade,
  day_of_week   smallint not null check (day_of_week between 1 and 7), -- Mon=1
  is_rest_day   boolean not null default false,      -- §15 rest days
  label         text,                                -- 'Push','Pull','Legs','Rest'
  unique (program_week_id, day_of_week)
);

create table program_workouts (                      -- links a program day to a template
  id           uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references program_days(id) on delete cascade,
  template_id  uuid not null references workout_templates(id) on delete restrict,
  position     int not null default 0,
  progression_note text,                             -- §15 progression guidance
  unique (program_day_id, template_id)
);
```

---

## 7. Workout tracking (§9, §10, §11, §17) — the MVP core

```sql
create table workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  template_id   uuid references workout_templates(id) on delete set null, -- started from template
  program_day_id uuid references program_days(id) on delete set null,
  name          text,
  status        text not null default 'active' check (status in ('active','completed','discarded')),
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,                          -- §9 finish workout (name matches testing.md flow 12)
  notes         text,
  -- cached metrics (§17, §82 avoid re-query during active workout) computed on finish
  duration_seconds int,
  total_sets    int,
  completed_sets int,
  total_reps    int,
  total_volume  numeric,                              -- §17 sum(weight*reps)
  client_uuid   uuid,                                 -- offline dedupe key (§39, offline.md)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table workout_session_exercises (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references workout_sessions(id) on delete cascade,
  exercise_id   uuid not null references exercises(id) on delete restrict, -- restrict: history keeps archived (§87)
  position      int not null,                         -- §9 reorder
  notes         text,                                 -- §9 add notes
  client_uuid   uuid unique,                          -- offline idempotency key (decision E)
  created_at    timestamptz not null default now(),
  unique (session_id, position)
);

create table workout_sets (
  id            uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references workout_session_exercises(id) on delete cascade,
  set_number    int not null,
  set_type      set_type not null default 'normal',   -- §10
  weight        numeric check (weight is null or weight >= 0),   -- normalized kg (§89); no negatives (testing 4.1)
  reps          int     check (reps   is null or reps   >= 0),   -- no negatives; 1RM calc excludes reps=0 (testing 4.2)
  duration_seconds int  check (duration_seconds is null or duration_seconds >= 0), -- §11
  distance      numeric check (distance is null or distance >= 0),               -- normalized km/m (§11)
  rpe           numeric(3,1),                          -- optional effort
  is_completed  boolean not null default false,        -- §9 complete sets
  completed_at  timestamptz,
  client_uuid   uuid unique,                           -- offline idempotency key (decision E)
  created_at    timestamptz not null default now(),
  unique (session_exercise_id, set_number)
);

create table personal_records (                        -- §16 auto-detected
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  exercise_id   uuid not null references exercises(id) on delete cascade,
  pr_type       pr_type not null,
  value         numeric not null,                      -- kg / reps / volume / distance / seconds
  reps          int,                                   -- context for weight/e1RM PRs
  achieved_at   timestamptz not null default now(),
  workout_set_id uuid references workout_sets(id) on delete set null, -- provenance
  created_at    timestamptz not null default now()
);
```

`workout_session_exercises.exercise_id` uses `on delete restrict` and exercises are
soft-deleted (`is_active=false`) so archived exercises stay visible in history (§87 L2892).

---

## 8. Body, nutrition, activity (§20, §22–26)

```sql
create table body_measurements (                       -- §20
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  body_fat_pct numeric(4,1),
  waist_cm    numeric(5,2), chest_cm numeric(5,2), arms_cm numeric(5,2),
  thighs_cm   numeric(5,2), hips_cm  numeric(5,2), neck_cm numeric(5,2),
  created_at  timestamptz not null default now()
);

create table weight_logs (                             -- §20 weight over time (separate for chart freq)
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  weight_kg   numeric(6,2) not null,                   -- normalized (§89)
  recorded_at timestamptz not null default now(),
  source      text not null default 'manual',          -- 'manual'|'apple_health'|'android_health'
  created_at  timestamptz not null default now()
);

create table nutrition_goals (                          -- §25, 1:1
  user_id        uuid primary key references profiles(id) on delete cascade,
  mode           nutrition_goal_mode,                   -- §6 screen 6
  calorie_goal   int,
  protein_g      int, carbs_g int, fat_g int, fiber_g int, -- §22
  water_ml_goal  int,                                    -- §24
  is_estimated   boolean not null default false,         -- §25 label estimates
  updated_at     timestamptz not null default now()
);

create table foods (                                     -- §23; prep for USDA/OFF (§23 L1453)
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  brand         text,
  serving_size  numeric, serving_unit text,
  calories      numeric, protein_g numeric, carbs_g numeric, fat_g numeric, fiber_g numeric,
  external_provider text,                                -- 'usda'|'open_food_facts'|null
  external_id   text,
  created_by    uuid references profiles(id) on delete set null, -- null = catalog; set = custom (§23 L1451)
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now()
);

create table meals (                                     -- §33: a meal = a slot on a day (groups food_logs)
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  log_date    date not null,                             -- user local date (§88 L2902)
  meal_type   meal_type not null,                        -- §23
  created_at  timestamptz not null default now(),
  unique (user_id, log_date, meal_type)
);

create table food_logs (                                 -- §23 individual entries
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade, -- denormalized for RLS/index
  meal_id     uuid not null references meals(id) on delete cascade,
  food_id     uuid references foods(id) on delete set null, -- null if free-text entry
  food_name   text,                                       -- snapshot (survives food edits/deletes)
  quantity    numeric not null default 1,
  serving     text,
  calories    numeric, protein_g numeric, carbs_g numeric, fat_g numeric, fiber_g numeric, -- snapshot
  logged_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table water_logs (                                -- §24
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  amount_ml   int not null,                              -- normalized (§89)
  logged_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table daily_activity (                            -- §26 (one row per user per day)
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  activity_date date not null,
  steps         int, active_calories numeric, distance_m numeric, active_minutes int,
  source        text not null default 'manual',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, activity_date)
);
```

---

## 9. Subscriptions, devices, health, analytics, audit (§43, §32, §27/§28, §44, §95)

```sql
create table subscriptions (                             -- §43
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
  unique (user_id)                                       -- one active sub row per user
);

create table notification_preferences (                  -- §32 granular
  user_id            uuid primary key references profiles(id) on delete cascade,
  workout_reminders  boolean not null default true,
  rest_timer         boolean not null default true,
  streak_reminders   boolean not null default true,
  weekly_summary     boolean not null default true,
  goal_milestones    boolean not null default true,
  program_reminders  boolean not null default true,
  updated_at         timestamptz not null default now()
);

create table device_tokens (                             -- §32 push (Expo/FCM/APNs)
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  token       text not null,
  platform    text not null check (platform in ('ios','android')),
  created_at  timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (token)
);

create table health_connections (                        -- §27/§28
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  provider    health_provider not null,
  is_enabled  boolean not null default true,
  scopes      text[] not null default '{}',              -- least-privilege grants
  last_synced_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, provider)
);

create table analytics_events (                          -- §44 (server-side mirror; PostHog is primary)
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete set null, -- nullable: pre-auth
  event       text not null,                             -- §44 standardized names
  properties  jsonb not null default '{}',               -- no sensitive health data (§44 L1886)
  created_at  timestamptz not null default now()
);

create table admin_audit_logs (                          -- §95
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references profiles(id) on delete set null,
  action        text not null,
  resource_type text not null,
  resource_id   uuid,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
```

---

## 10. `updated_at` trigger

```sql
create or replace function set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
-- attach to every table with an updated_at column, e.g.:
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
-- ...repeat for user_settings, user_goals, exercises, workout_templates, programs,
--    workout_sessions, subscriptions, daily_activity, etc.
```

Triggers kept "sparse" per §33 (L166): only `updated_at` and (optionally) a PR-detection
trigger. **PR detection (§16) is business logic — it belongs in `PersonalRecordService`
(§93), not a DB trigger**, so correctness is testable in app code. Flagged as a decision, not
a contradiction.

---

## 11. Indexing (§35 L1677)

Spec-named indexes plus the ones the §81 MVP loop and §18 progress queries require:

```sql
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
create index idx_exercises_name_trgm          on exercises using gin (name gin_trgm_ops); -- §58 search
create index idx_exercise_muscles_muscle      on exercise_muscles(muscle_id);
create index idx_body_measurements_user_time  on body_measurements(user_id, recorded_at desc);
create index idx_user_goals_user_status       on user_goals(user_id, status);
```

Requires extensions: `pgcrypto` (gen_random_uuid), `pg_trgm` (search), `unaccent` (alias norm).
"Analyze query patterns before blindly adding indexes" (§35 L1693) — these map 1:1 to the
read paths in `api.md`; no speculative indexes.

---

## 12. RLS stance per table (full policies in `rls.md`)

| Table | Stance |
|---|---|
| profiles, user_settings, user_goals, notification_preferences, nutrition_goals | owner-only (`user_id/id = auth.uid()`) |
| workout_sessions, workout_session_exercises, workout_sets, personal_records | owner-only (child tables join to parent's `user_id`) |
| workout_templates, workout_template_exercises | owner-only; +public read when `visibility='public'` |
| programs, program_weeks, program_days, program_workouts | owner-only via program.user_id |
| body_measurements, weight_logs, daily_activity, water_logs, meals, food_logs | owner-only |
| exercise_favorites, device_tokens, health_connections, subscriptions | owner-only |
| exercises | public read where `is_active`; owner read/write own custom (`created_by=auth.uid()`); admin write all |
| exercise_muscles, exercise_aliases | public read; write follows parent exercise ownership |
| foods | public read catalog (`created_by is null` or verified); owner read/write own custom |
| muscles, equipment, exercise_categories | public read; admin write |
| analytics_events | insert-own; no client select (backend/PostHog reads) |
| admin_audit_logs | admin-only select; insert via service role only |

Every table above appears in §33's list plus the 3 lookups (`muscles`, `equipment`,
`exercise_categories`) required to normalize §13's fixed lists (§33 L167). Every FK in §1–9
resolves to a table defined here.

---

## §81 MVP loop traceability (DONE gate)

Register → `profiles`/`user_settings` rows. Onboarding → profile columns (goal, level, DOB,
units, frequency). Start workout → `workout_sessions` (optional `template_id`). Search/select
illustrated exercise → `exercises` (+`exercise_aliases`, media cols). Log sets →
`workout_session_exercises` + `workout_sets`. Finish → `workout_sessions.ended_at` + cached
metrics; PR check writes `personal_records`. Summary → read cached metrics. Return later / see
previous values → `idx_sessions_user_started` + previous-performance query (`api.md
GET /progress/exercises/:id`). Increase weight → new `workout_sets`. See progress →
`personal_records` + `workout_sets` volume over `idx_prs_user_exercise`. **Every step maps to a
table + index.**

---

## Assumptions & flagged contradictions

- **A1 `meals` vs `food_logs` (§33 lists both).** Spec never defines `meals`. Modeled `meals`
  as a per-day per-slot container that groups `food_logs`; `food_logs.meal_type` is derived
  from its parent meal. If Dwight/QA expect `meals` = saved recipe, revisit.
- **A2 `notification_preferences` is 1:1** but §33 lists it in the per-user tables; kept as its
  own table with `user_id` PK (not merged into `user_settings`) to honor §33's explicit list.
- **A3 Units normalization (§89 L2924 "store normalized where appropriate").** All physical
  quantities stored metric (kg/cm/km/ml); display conversion is client-side via
  `user_settings`. Snapshot columns in `food_logs` intentionally denormalized so history
  survives `foods` edits (data-integrity §101 #2).
- **A4 PR detection placed in service layer, not a trigger** (§16 + §33 "triggers sparingly").
  Decision, not silent — see §10.
- **A5 `set_type` as enum** despite §10 "allow additional types later"; upgrade path = lookup
  table. Flagged in §2.
- **CONTRADICTION C1:** §100/§103 say "review the existing Supabase schema" / "analyze the
  current repository" — **there is no existing repo/schema; this is greenfield** (confirmed by
  god). Treated all "existing" references as "to be created".
- **Dependency on Dwight:** exercise media/import columns (`asset_*`, `external_*`, `source`)
  are declared here but their population/mapping is Dwight's `workout-guide-integration.md` /
  `exercise-mapping.md` (§103 items 6–7).
