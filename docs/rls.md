# Gainly — Row Level Security Plan (`rls.md`)

Owner: Jan. Covers §103 item 5. Sources: §34 (L1654), §5 (L282 roles), §46 (L1912),
§87 (L2888), §90 (L2938). Priority §101 #3 security; #1 correctness (deny-by-default).

**Model.** RLS is Gainly's **primary authorization layer** (clients query Supabase directly
with the user's JWT — `architecture.md §1`). Every table has RLS **enabled** and **forced**;
default posture is deny. `auth.uid()` = the requesting user. Admin ops and cross-user work run
through `apps/api` with the **service-role key** (bypasses RLS) — never shipped to clients
(§34 L1671–1673).

```sql
alter table <t> enable row level security;
alter table <t> force row level security;   -- applies RLS even to table owner
```

Helper for admin checks (avoids recursive policy on `profiles`):
```sql
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;
```
`is_admin` is read from `profiles.is_admin` (server-controlled), **never** from a client-supplied
role or JWT claim the user can set (§5 L297).

---

## 1. Owner-only tables (the default pattern)

Applies to: `profiles`* , `user_settings`, `user_goals`, `nutrition_goals`,
`notification_preferences`, `body_measurements`, `weight_logs`,
`water_logs`, `meals`, `food_logs`, `daily_activity`, `exercise_favorites`, `device_tokens`,
`health_connections`, `workout_sessions`, `workout_templates`* , `programs`.

> **`subscriptions` and `personal_records` are deliberately NOT here** — both are SELECT-own with
> service-role-only writes (see §5).
> - `subscriptions` — A2 FIX (Oscar G-17 CRITICAL). Owner-writable would let a user
>   `update subscriptions set plan='pro', status='active' …` → free Pro, defeating any server-side
>   Pro gate. Writes are the Stripe webhook only.
> - `personal_records` — RULED G-26 (god). PRs are **derived** data computed server-side from
>   logged sets. Owner-writable is both an integrity bug (a user can fabricate a PR that
>   contradicts their own set history) and a **correctness** bug: the offline model is
>   last-write-wins by `updated_at`, so a client-written PR and a server-computed PR have no
>   defined precedence. Same class as A2. Client keeps SELECT-own (the UI can show an optimistic
>   local PR and let the server confirm), so nothing breaks.

```sql
-- generic owner policy (user_id column). profiles uses id instead of user_id.
create policy sel_own on <t> for select using (user_id = auth.uid());
create policy ins_own on <t> for insert with check (user_id = auth.uid());
create policy upd_own on <t> for update using (user_id = auth.uid())
                                    with check (user_id = auth.uid());
create policy del_own on <t> for delete using (user_id = auth.uid());
```

`profiles` (PK `id` = auth user):
```sql
-- deleted_at is null: a soft-deleted account (in its grace window, decision D-a) is invisible,
-- not "deleted-but-queryable" — this is what makes soft-delete satisfy §90 privacy.
create policy sel_self on profiles for select using (id = auth.uid() and deleted_at is null);
create policy upd_self on profiles for update using (id = auth.uid() and deleted_at is null)
                                        with check (id = auth.uid());
-- INSERT: signup trigger / service role only (no client insert policy).

-- A1 FIX (Oscar G-17 CRITICAL — admin self-escalation). upd_self does NOT restrict columns, so
-- without this a user could `update profiles set is_admin=true where id=auth.uid()` and RLS would
-- ALLOW it (they own the row; id is unchanged). is_admin() then returns true, granting catalog
-- write + sel_admin on admin_audit_logs (other users' resource_ids/metadata = indirect leak).
-- Column privileges are checked INDEPENDENTLY of RLS and cannot be re-granted by a careless
-- future policy — this is the primary, durable control (prose is not a control).
-- HARDENING (Oscar G-21): FAIL CLOSED, not open. An enumerated `revoke update (is_admin)` leaves
-- any FUTURE column (is_moderator, verified_coach, stripe_customer_id, …) writable until someone
-- remembers to revoke it. Instead revoke ALL update, then allow-list only the user-editable
-- columns — a new column is then non-writable by users until explicitly granted.
revoke update on profiles from authenticated;
grant  update (username, display_name, avatar_url, date_of_birth, biological_sex, height_cm,
               fitness_goal, experience_level, measurement_system, training_days_per_week,
               onboarding_completed_at)
  on profiles to authenticated;
-- is_admin, deleted_at, id, created_at, updated_at are intentionally NOT in the grant list →
-- user-writable only via service role. New privileged columns inherit deny-by-default.

-- Defense-in-depth trigger (the grant list above is primary; this catches a mistaken re-GRANT).
-- Symmetric: guards BOTH privileged self-service columns.
create or replace function guard_profiles_privileged_cols() returns trigger
language plpgsql as $$
begin
  -- G-23 FIX: gate on current_user, NOT is_admin() alone. Under service_role auth.uid() is NULL,
  -- so is_admin() (= coalesce((select is_admin from profiles where id=auth.uid()), false)) is
  -- ALWAYS false — a bare `not is_admin()` would fire for service_role and BLOCK the two writes
  -- this guard exists to PERMIT: the §7 soft-delete (`set deleted_at`) and the §1 service-role-only
  -- promotion (`set is_admin`), and would make first-admin bootstrap impossible. Gating on
  -- `current_user = 'authenticated'` fires for exactly the client role the guard defends and never
  -- for service_role, postgres, or a migration. (Function is NOT security definer, so current_user
  -- is the calling role.) `request.jwt.role` GUC was rejected: a direct/psql/pgTAP connection never
  -- sets it, so that predicate would still fire on migrations.
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
```
Protects everything §34 L1660 lists: workouts, body metrics, nutrition, health, goals,
profile, subscriptions, custom exercises.

**`workout_sessions` — derived-aggregate columns are service-role-write-only** (G-29, the THIRD
instance of the server-authoritative-data-left-client-writable class, after A2 subscriptions and
G-26 personal_records). `duration_seconds, total_sets, completed_sets, total_reps, total_volume`
are cached aggregates computed server-side on finish (`database.md §7`, §81) from `workout_sets`.
`upd_own` (the generic §1 pattern) permits UPDATE with no column restriction, so without this a
client could write bogus aggregates. **Distinction — same bug class, two correct mechanisms:**
`workout_sessions` keeps a COLUMN grant because users genuinely own *some* of its columns (name,
notes, status, times); `personal_records` loses ALL client writes (§5) because the *whole table*
is server-authoritative. Fail-closed revoke-then-grant (same shape as profiles A1):

```sql
revoke update on workout_sessions from authenticated;
grant  update (name, notes, status, started_at, ended_at, template_id, program_day_id, client_uuid)
  on workout_sessions to authenticated;
-- duration_seconds, total_sets, completed_sets, total_reps, total_volume, user_id, id, created_at,
-- updated_at are NOT granted → writable only by the service role (finish/metrics job). A future
-- cached-aggregate column inherits deny-by-default.
```

**`health_connections` — provider-asserted columns are service-role-write-only** (G-29, MEDIUM).
`last_synced_at` is written by the sync job; **`scopes` is what the PROVIDER granted, not what the
user may assert** — a real hole if any code ever gates on `scopes`. Fail-closed revoke-then-grant:

```sql
revoke update on health_connections from authenticated;
grant  update (is_enabled) on health_connections to authenticated; -- user may only toggle on/off
-- provider is set on INSERT (ins_own with check user_id=auth.uid()); scopes + last_synced_at are
-- service-role-only (written by the HealthSyncService), never client-asserted.
```

---

## 2. Child tables (authorize via parent's owner)

Child rows have no `user_id`; they inherit ownership through their parent. Use an `exists`
join. (`workout_sets` → `workout_session_exercises` → `workout_sessions.user_id`.)

```sql
-- workout_session_exercises → workout_sessions
create policy own_via_session on workout_session_exercises for all
using (exists (select 1 from workout_sessions s
               where s.id = session_id and s.user_id = auth.uid()))
with check (exists (select 1 from workout_sessions s
               where s.id = session_id and s.user_id = auth.uid()));

-- workout_sets → workout_session_exercises → workout_sessions
create policy own_via_session on workout_sets for all
using (exists (select 1 from workout_session_exercises se
               join workout_sessions s on s.id = se.session_id
               where se.id = session_exercise_id and s.user_id = auth.uid()))
with check (exists (select 1 from workout_session_exercises se
               join workout_sessions s on s.id = se.session_id
               where se.id = session_exercise_id and s.user_id = auth.uid()));
```

A6 FIX (Oscar G-17): the remaining child tables are spelled out in full — **both `using` and
`with check`** on `for all` — because "same pattern" is exactly how an implementer drops the
`with check` and reopens the re-parent hole.

```sql
-- workout_template_exercises → workout_templates
create policy own_via_template on workout_template_exercises for all
using (exists (select 1 from workout_templates t
               where t.id = template_id and t.user_id = auth.uid()))
with check (exists (select 1 from workout_templates t
               where t.id = template_id and t.user_id = auth.uid()));

-- program_weeks → programs
create policy own_via_program on program_weeks for all
using (exists (select 1 from programs p
               where p.id = program_id and p.user_id = auth.uid()))
with check (exists (select 1 from programs p
               where p.id = program_id and p.user_id = auth.uid()));

-- program_days → program_weeks → programs
create policy own_via_program on program_days for all
using (exists (select 1 from program_weeks w join programs p on p.id = w.program_id
               where w.id = program_week_id and p.user_id = auth.uid()))
with check (exists (select 1 from program_weeks w join programs p on p.id = w.program_id
               where w.id = program_week_id and p.user_id = auth.uid()));

-- program_workouts → program_days → program_weeks → programs
create policy own_via_program on program_workouts for all
using (exists (select 1 from program_days d
               join program_weeks w on w.id = d.program_week_id
               join programs p on p.id = w.program_id
               where d.id = program_day_id and p.user_id = auth.uid()))
with check (exists (select 1 from program_days d
               join program_weeks w on w.id = d.program_week_id
               join programs p on p.id = w.program_id
               where d.id = program_day_id and p.user_id = auth.uid()));
```

The parent-join indexes in `database.md §11` keep these `exists` checks cheap.

---

## 3. Shared-content tables

### exercises (public library + private custom — §13 L627)
```sql
create policy sel_active_public on exercises for select
  using (is_active and created_by is null);          -- global library, active only
create policy sel_own_custom on exercises for select
  using (created_by = auth.uid());                   -- my custom (incl. inactive)
create policy ins_own_custom on exercises for insert
  with check (created_by = auth.uid() and is_custom); -- users may only create custom
create policy upd_own_custom on exercises for update
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy admin_all on exercises for all
  using (is_admin()) with check (is_admin());         -- §41 admin manages library
-- A5 FIX v2 (Oscar G-21): direct fetch of an ARCHIVED GLOBAL exercise in history. MUST be scoped
-- to `created_by is null` (global library) — WITHOUT it this policy is itself an IDOR: the FK
-- exercises(id) does NOT enforce RLS, so an attacker who learns a victim's private custom
-- exercise uuid X (leaked via the public template/program sharing this doc plans, or any
-- feed/PR surface) can insert workout_session_exercises{session=OWN, exercise_id=X} — own_via_session
-- only checks session ownership, not exercise_id visibility — then select X and this policy would
-- match. Restricting to `created_by is null` (and archived rows only) closes it; a user's OWN
-- custom rows are already covered by sel_own_custom, so nothing legitimate is lost.
create policy sel_archived_in_history on exercises for select
  using (exercises.created_by is null                      -- global library rows only (kills the IDOR)
     and not exercises.is_active                           -- gap-fill: active globals already via sel_active_public
     and exists (select 1 from workout_session_exercises se
                 join workout_sessions s on s.id = se.session_id
                 where se.exercise_id = exercises.id and s.user_id = auth.uid()));
```
Archived global exercises (`is_active=false`, `created_by is null`) stay readable **inside
history** two ways: the common path joins through the owned session (no fresh `exercises` select),
and a direct fetch-by-id is covered by `sel_archived_in_history` above — now strictly scoped to
global rows, so injecting another user's custom `exercise_id` into an owned session no longer
leaks it. **No service-role resolver is used** for this (§87 L2892) — that path was an IDOR and is
removed from `api.md`.

### exercise_muscles / exercise_aliases (follow parent)
```sql
create policy sel_public on exercise_aliases for select
  using (exists (select 1 from exercises e where e.id = exercise_id
                 and ((e.is_active and e.created_by is null) or e.created_by = auth.uid())));
create policy write_via_owner on exercise_aliases for all
  using (exists (select 1 from exercises e where e.id = exercise_id
                 and (e.created_by = auth.uid() or is_admin())))
  with check (exists (select 1 from exercises e where e.id = exercise_id
                 and (e.created_by = auth.uid() or is_admin())));
-- exercise_muscles: identical shape.
```

### foods (catalog + custom — §23 L1451)
```sql
create policy sel_catalog_or_own on foods for select
  using (created_by is null or is_verified or created_by = auth.uid());
-- A4 FIX (Oscar G-17, refined G-21): sel_catalog_or_own exposes is_verified rows to EVERYONE, so a
-- user must not be able to set/keep is_verified=true on their own food. Column REVOKE is wrong here
-- (admins verify via the same `authenticated` role, so a revoke would block them too).
-- G-21 refinement: an unconditional `with check (is_verified is not true)` had a functional
-- side-effect — once an admin verified a user's food, the user could NEVER edit that row again
-- (every update failed the check). Fix: policies check only ownership; a TRIGGER blocks non-admin
-- is_verified TRANSITIONS (and non-admin INSERT with is_verified=true), so a user CAN still edit
-- other fields of a verified food, but cannot flip verification.
-- (`foods.is_verified` already `not null default false` in database.md:447, so INSERT defaults safe.)
create policy ins_own on foods for insert with check (created_by = auth.uid());
create policy upd_own on foods for update using (created_by = auth.uid())
                                     with check (created_by = auth.uid());
create policy admin_all on foods for all using (is_admin()) with check (is_admin()); -- only admins verify

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
```

### workout_templates public sharing (post-MVP)
Owner-only in §1, **plus** optional public read:
```sql
create policy sel_public_template on workout_templates for select
  using (visibility = 'public');
-- template_exercises then also readable when parent is public (add is_public branch).
```
MVP: all templates `private`; the public branch is dormant until sharing ships.

---

## 4. Lookup tables (public read, admin write)

`muscles`, `equipment`, `exercise_categories`:
```sql
create policy sel_all on <lookup> for select using (true);
create policy admin_write on <lookup> for all using (is_admin()) with check (is_admin());
```

---

## 5. Write-only / restricted tables

**HOUSE PATTERN (G-29 ruling — double-gate service-role-write surfaces with a REVOKE).** Force-RLS
with no write policy denies client writes *today*, but that is SINGLE-GATED: Supabase auto-grants
INSERT/UPDATE/DELETE to `authenticated` on every new public table, so the moment anyone adds a
permissive write policy the sitting grant re-opens writes instantly. Same reasoning as profiles A1.
So, as a rule (a rule survives a new table; a static list does not):

> For any table, **revoke each WRITE operation (INSERT/UPDATE/DELETE) that has NO permissive
> policy**, derived from that table's actual policy set. (SELECT is governed by its own policy /
> force-RLS; this ruling addresses the write-recurrence path — the bug class we have now hit 4×.)

Derived for today's tables (recompute per table, never assume):
```sql
-- personal_records — policy set = SELECT-own only  → no write policy → revoke all writes
revoke insert, update, delete on personal_records from authenticated, anon;
-- subscriptions — policy set = SELECT-own only      → revoke all writes
revoke insert, update, delete on subscriptions      from authenticated, anon;
-- analytics_events — HAS ins_own (INSERT) policy    → keep insert; revoke the rest
revoke update, delete            on analytics_events  from authenticated, anon;
-- admin_audit_logs — policy set = sel_admin (SELECT) only → no write policy → revoke all writes
revoke insert, update, delete on admin_audit_logs   from authenticated, anon;
```

⚠️ **TRAP — revoke from `authenticated` (and `anon`) ONLY. NEVER `service_role`, NEVER `public`.**
`bypassrls` does NOT bypass GRANTs — `service_role` needs its grant intact. A revoke aimed at
`public` (or at `service_role`) breaks every server-side write and will look like an RLS bug when
it is a grant bug.

```sql
-- analytics_events: user may insert own; NO client select (backend/PostHog read via service role)
create policy ins_own on analytics_events for insert
  with check (user_id = auth.uid() or user_id is null);
-- (no select policy → clients cannot read; §44 L1886 keeps health data out anyway)

-- admin_audit_logs: admins read; inserts only via service role (no insert policy)
create policy sel_admin on admin_audit_logs for select using (is_admin());
-- INSERT: service role only (bypasses RLS); never client-writable (§95 integrity)

-- subscriptions: A2 FIX (Oscar G-17 CRITICAL — free Pro). SELECT-own only; NO insert/update/delete
-- policy → clients cannot write. plan/status/period are set ONLY by the Stripe webhook via service
-- role (which bypasses RLS). Moved out of §1 so the generic owner pattern cannot re-grant writes.
create policy sel_own on subscriptions for select using (user_id = auth.uid());
-- (no ins/upd/del policy → any client write is denied by default-deny)

-- personal_records: RULED G-26 (god). DERIVED data — computed server-side from logged sets by
-- PersonalRecordService (workout-semantics.md, database.md §10). SELECT-own only; writes via
-- service role only. Owner-writable would allow fabricated PRs AND has no LWW precedence vs the
-- server-computed row (correctness bug, same class as A2). NB: PR creation now DEPENDS on the
-- server-side detection existing — a missing feature is the correct trade against fabricated data.
create policy sel_own on personal_records for select using (user_id = auth.uid());
-- (no ins/upd/del policy → clients cannot write; PR rows are inserted by the service role only)
```

**Two non-RLS caveats (Oscar G-28) — RLS alone does NOT cover these:**
- **App-layer ownership check (PersonalRecordService).** A PR's `workout_set_id` FK guarantees the
  set EXISTS, not that it belongs to the same `user_id`. The service MUST validate
  `workout_set → session.user_id == personal_records.user_id` before insert. Easy to lose when the
  change is framed as "just an RLS edit" — it is an application invariant, not an RLS one.
- **⚠️ WARNING — do NOT add an `updated_at` column to `personal_records`.** It has none today, by
  design. The offline last-write-wins-by-`updated_at` ambiguity is fixed by **removing the client
  as a writer** (above), collapsing to a single writer. Adding an `updated_at` tiebreaker would
  re-admit the client as a writer and leave the forgery hole wide open. The fix is one-writer, not
  a better tiebreaker.
- **`workout_set_id` MUST always be populated by PersonalRecordService.** `pr_dedupe_by_set` is a
  PARTIAL unique (`where workout_set_id is not null`), so a null-set PR (from a backfill or manual
  path) dedupes against nothing and a retried finish escapes the guard. No PR-insert path may leave
  `workout_set_id` null.

**ACCEPTED RESIDUAL RISK (G-29 ruling — conscious acceptance, not an oversight).** Making PR writes
server-only makes a PR *consistent with the user's own logged sets*, NOT *unforgeable*. Forgery
moves UP to `workout_sets`, which is correctly client-writable — a user can log a fabricated set
(weight 999, reps 1, completed) and PersonalRecordService will derive a legitimate-looking PR. This
is **accepted as correct for a personal tracker**: you cannot RLS away a user lying about their own
workout, and plausibility limits now would reject real outliers and annoy honest users. **TRIGGER
CONDITION (the line that turns this from accepted-risk into a defect if crossed):** *if PRs ever
feed a CROSS-USER surface — leaderboard, social comparison, coach dashboard, public profile — THEN
`workout_sets` becomes the trust boundary and needs server-side plausibility bounds at the set or
PR-derivation layer.* There are none today beyond the `>= 0` CHECKs (`database.md §7`).

---

## 6. Storage buckets (§184, §46)

- `avatars` — private; path convention `avatars/{auth.uid()}/…`; signed URLs (§198).
- `exercise-media` — public read (illustrations), admin write [→ dwight for asset flow].
- `progress-photos` (future) — private, owner-only, signed URLs (§90 sensitive).

A9 FIX (Oscar G-17): spelled out for **every op** and with **`with check`** on write, or a user can
write into another user's folder. `storage.objects` has RLS on by default; owner = first path segment.

```sql
-- avatars: read/write only within your own {uid}/ prefix (private bucket)
create policy avatars_sel on storage.objects for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_ins on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_upd on storage.objects for update
  using      (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_del on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
-- progress-photos (future): identical shape with bucket_id='progress-photos'.
-- exercise-media: public SELECT (using bucket_id='exercise-media'); write via is_admin() only.
```

**A9 implementation note (Oscar G-21):** `(storage.foldername(name))[1]` is the object key's **first
path segment**, so upload code MUST key objects as `<uid>/filename`, e.g. `avatars/<uid>/me.jpg`
→ store the object at key `<uid>/me.jpg` in the `avatars` bucket. If the key starts with anything
other than the uid (e.g. the bucket name, or a flat filename), the check reads the wrong segment
and either denies everything or, worse, matches unintended paths. Whoever writes the upload path
owns keying it `<uid>/…`.

---

## 7. Account deletion (§90 L2938) — decision D-a (see `database.md §13`)

Two-step, **hard-delete wins for the account** (§90) while *content* soft-deletes (§87):
1. **Soft window:** on user request, revoke the refresh token + set `profiles.deleted_at`.
   (This `set deleted_at` write runs via service role and is UNBLOCKED by the G-23 guard fix in §1 —
   the guard now only fires for `current_user = 'authenticated'`, so service-role deletion succeeds.)
   A7 correction (Oscar G-17, refined G-21 — stated precisely, no overclaim):
   - The **`profiles` row is immediately invisible**: only the profiles policies carry the
     `deleted_at is null` predicate, so the account's profile returns zero rows at once.
   - **Non-profile owner rows are NOT immediately cut off**, but the exposure differs by table:
     - *Owner-writable tables* — `workout_sessions`, `workout_sets`, `body_measurements`,
       `weight_logs`, `food_logs`, `meals`, `water_logs`, `daily_activity`, `user_goals` etc. filter
       on `user_id = auth.uid()` with **no `deleted_at` check**, so a still-valid access JWT keeps
       both **reading and writing** that user's OWN rows until the token's TTL.
     - *Service-role-write-only tables* — `personal_records` and `subscriptions` are SELECT-own with
       zero client write policies (§5, A2 + G-26), so the window is a **READ** exposure only for
       these two; a client cannot write them regardless of the token.
     Either way it is **same-user only, no cross-user leak**, and bounded by access-token TTL, not
     instantaneous.
   - The access JWT is stateless; revoking refresh stops new tokens, and the short access-token TTL
     bounds the residual window. If instantaneous cutoff on all owner data is ever required, gate
     the sensitive owner policies on
     `exists (select 1 from profiles p where p.id = auth.uid() and p.deleted_at is null)` — new
     machinery, deliberately NOT added for MVP; the honest TTL-bounded wording above is the stance.
2. **Hard purge:** an `apps/api` service-role job deletes the `auth.users` row after the grace
   window (or immediately on "delete now"); `on delete cascade` from `profiles` removes every
   owner row (sessions, sets, PRs, body, nutrition, goals, subscriptions, devices, health) — no
   orphans. `analytics_events.user_id` is `on delete set null`, so aggregate rows survive
   de-identified. This is the §90 "delete my data" guarantee.

---

## 8. Workout Guide sync scope invariant (Dwight G-3, god-ratified)

**Invariant:** a Workout Guide sync/import may only create or modify `exercises` rows with
`source='workout_guide'` and must **never** touch user data. god's directive: encode at the DB,
not on importer good behavior.

**Canonical control = a trigger, because RLS cannot see this actor.** The importer runs as
`service_role` (Supabase's default server-side path; the project is a **hosted** instance, no
Docker), and `service_role` **bypasses RLS and every policy**. So a role-scoped RLS policy would
be silently *inert* against the exact actor it is meant to constrain. A `before insert/update/
delete` trigger fires regardless of role — `service_role` included — so it is the only mechanism
that cannot be bypassed by "oops, ran as service_role." This is a correctness/data-integrity
guard (§101 #1–#2), which outranks elegance.

The importer opens its transaction with `set local app.import_context = 'workout_guide'`; the
trigger raises on any row whose `source <> 'workout_guide'`, so an import that strays onto a
user/gainly row aborts:

```sql
create or replace function enforce_wg_sync_scope() returns trigger
language plpgsql as $$
begin
  -- Fires for ALL roles, service_role included — this is why a trigger, not an RLS
  -- policy, is canonical (service_role bypasses RLS). Two independent guards:

  -- GUARD 1 — ALWAYS ON, fail-closed, no flag: exercises.source is immutable on an
  -- existing row, for every actor. This permanently kills the "flip a user row into the
  -- WG library" hijack: an UPDATE can never change source, so a source='user'/'gainly'
  -- row can never be turned into 'workout_guide'. `is distinct from` is null-safe.
  if tg_op = 'UPDATE' and new.source is distinct from old.source then
    raise exception 'exercises.source is immutable (attempted % -> %)',
      old.source, new.source;
  end if;

  -- GUARD 2 — flag-gated import scope (defense-in-depth): inside a WG import transaction
  -- (importer runs `set local app.import_context = 'workout_guide'`), only
  -- source='workout_guide' rows may be touched at all, for ANY field. Read OLD on DELETE,
  -- NEW on INSERT/UPDATE — never the unassigned side. Combined with guard 1, an UPDATE
  -- that passes here provably had old.source='workout_guide' too.
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

  -- Explicit return: OLD for DELETE, NEW otherwise. Never coalesce composite records —
  -- a NULL return from a BEFORE row trigger silently CANCELS the write (a data-loss path
  -- that looks like success), so we never let the return expression evaluate to NULL.
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

create trigger trg_wg_sync_scope
  before insert or update or delete on exercises
  for each row execute function enforce_wg_sync_scope();
```

**INSERT case (Oscar G-17 A3) — closed by an always-on CHECK, not the trigger.** Guard 1 constrains
only UPDATE and guard 2 only fires inside an import transaction, so a plain user INSERT asserting
`source='workout_guide'` (with `created_by=self, is_custom=true`) is caught by neither, and
`ins_own_custom`'s `with check` says nothing about `source`. The invariant is "a `workout_guide` row
is a global library row," i.e. `source='workout_guide'` ⟹ `created_by IS NULL` (exactly what
`sel_active_public` already keys on). Express it as a table CHECK — evaluated on INSERT and UPDATE,
for every role including `service_role`, impossible to forget or bypass by role:

```sql
alter table exercises
  add constraint exercises_wg_source_is_library
  check (source <> 'workout_guide' or created_by is null);
```

Canonical home is the `exercises` DDL in `database.md`; this ALTER is the migration-ready form and Jan
should mirror it into the table definition (rollback: `drop constraint exercises_wg_source_is_library`).
No legitimate flow sets `created_by` on a WG row — the importer inserts library rows with
`created_by = null`, and custom exercises use `source='user'`.

A normal user/admin transaction never sets `app.import_context`, so the guard is inert for them
and only constrains import transactions. Belt-and-suspenders with the importer's own
`WHERE source='workout_guide'` scoping (Dwight owns the importer).

*Optional hardening (not required, not assumed):* if the import is ever reworked to run under a
dedicated least-privilege login role instead of `service_role`, an additional RLS policy
(`source='workout_guide' and created_by is null` in `using`/`with check`) can layer on top. That
role and policy are **not defined elsewhere in this doc** and are out of scope until such a
rework happens — the trigger above stands alone as the enforced control.

**pgTAP (Angela).** Cases marked ✗→✓ FAIL on the pre-fix trigger and pass on this one; the rest are
positive/regression cases that must stay green. Import cases wrap the write in a txn with
`set local app.import_context='workout_guide'`.
- **T1 ✗→✓ (the live hole — source-flip hijack):** import txn, `update exercises set source='workout_guide' where id = <a source='user' row>` → `throws_ok`. Pre-fix passed silently (the guard's `coalesce` saw only NEW on UPDATE); now guard 1 raises.
- **T2 ✗→✓ (source immutability, no import context):** as a normal actor with NO `app.import_context` set, `update exercises set source='gainly' where id = <a source='user' row>` → `throws_ok`. Pre-fix allowed it (guard inert without the flag); now guard 1 raises.
- **T3 ✓ (importer's real pattern):** import txn, update a `source='workout_guide'` row's `name`/muscles only, source unchanged → `lives_ok`.
- **T4 ✓:** import txn, insert `source='workout_guide'` → `lives_ok`; insert `source='user'` → `throws_ok` (guard 2).
- **T5 ✓:** import txn, delete a `source='workout_guide'` row → `lives_ok`; delete a `source='user'` row → `throws_ok` (guard 2 DELETE branch reads OLD).
- **T6 ✓ (defect-1 regression):** with NO import context, delete any exercise → `lives_ok`, raising no "record new is not assigned" error — the function never reads NEW on DELETE.
- **T7 ✗→✓ (INSERT assertion — Oscar A3):** as a normal authenticated user with NO import context, `insert into exercises (name, source, created_by, is_custom, ...) values (..., 'workout_guide', auth.uid(), true, ...)` → `throws_ok` (violates `exercises_wg_source_is_library`). Pre-fix: allowed (neither guard fires on a user INSERT).

This tests both the trigger and the `exercises_wg_source_is_library` CHECK — the mechanisms that hold under `service_role`.

---

## Verification (DONE gate)
- **Every table in `database.md` has a stance above** — cross-checked against the §33 list +
  3 lookups. No table is left RLS-enabled with zero policies (which would deny all and break
  the app) except `admin_audit_logs`/`analytics_events` where the missing policy is intentional
  (service-role-only access).
- **Cross-user isolation (§34 L1658):** every owner/child policy filters on `auth.uid()`; no
  policy exposes another user's `user_id` rows. Manual test matrix belongs to Angela (§103
  item 13) — this doc defines the policies she asserts against.

## Assumptions & flagged contradictions
- **A1** `is_admin` stored on `profiles` and read via `SECURITY DEFINER is_admin()` to avoid
  RLS recursion. Alternative: a Postgres role/JWT custom claim set by a trusted trigger —
  heavier; deferred.
- **A2** Archived-exercise history reads: RESOLVED (Oscar G-17 A5). The `sel_archived_in_history`
  policy (§3) now covers direct fetch-by-id, scoped to exercises in the caller's own sessions. The
  former `apps/api` service-role resolver is **removed** — it was an IDOR (service role bypasses
  RLS, could return another user's private custom exercise). No service-role read path remains for
  this.
- No spec contradictions specific to RLS beyond the shared greenfield note (C1).
