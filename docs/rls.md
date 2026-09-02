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
`notification_preferences`, `subscriptions`, `body_measurements`, `weight_logs`,
`water_logs`, `meals`, `food_logs`, `daily_activity`, `exercise_favorites`, `device_tokens`,
`health_connections`, `workout_sessions`, `personal_records`, `workout_templates`* , `programs`.

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
create policy sel_self on profiles for select using (id = auth.uid());
create policy upd_self on profiles for update using (id = auth.uid())
                                        with check (id = auth.uid());
-- INSERT handled by a signup trigger / service role; is_admin & role cols not client-writable:
-- enforce via a trigger that rejects changes to is_admin unless is_admin() (defense in depth).
```
Protects everything §34 L1660 lists: workouts, body metrics, nutrition, health, goals,
profile, subscriptions, custom exercises.

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

Same pattern for:
- `workout_template_exercises` → `workout_templates.user_id`
- `program_weeks` → `programs`; `program_days` → `program_weeks` → `programs`;
  `program_workouts` → `program_days` → … → `programs.user_id`

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
```
Archived global exercises (`is_active=false`, `created_by is null`) stay readable **inside
history** because `workout_session_exercises` references them by FK and history reads go through
the owner policy on the session, not a fresh `exercises` select. For direct fetch of an
archived exercise in history context, `apps/api` resolves it (service role) — noted in
`api.md`. (§87 L2892.)

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
create policy ins_own on foods for insert with check (created_by = auth.uid());
create policy upd_own on foods for update using (created_by = auth.uid())
                                     with check (created_by = auth.uid());
create policy admin_all on foods for all using (is_admin()) with check (is_admin());
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

```sql
-- analytics_events: user may insert own; NO client select (backend/PostHog read via service role)
create policy ins_own on analytics_events for insert
  with check (user_id = auth.uid() or user_id is null);
-- (no select policy → clients cannot read; §44 L1886 keeps health data out anyway)

-- admin_audit_logs: admins read; inserts only via service role (no insert policy)
create policy sel_admin on admin_audit_logs for select using (is_admin());
-- INSERT: service role only (bypasses RLS); never client-writable (§95 integrity)
```

---

## 6. Storage buckets (§184, §46)

- `avatars` — private; RLS path convention `avatars/{auth.uid()}/…`; signed URLs (§198).
- `exercise-media` — public read (illustrations), admin write [→ dwight for asset flow].
- `progress-photos` (future) — private, owner-only, signed URLs (§90 sensitive).

Storage policies mirror the table pattern: `bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text`.

---

## 7. Account deletion (§90 L2938)

`profiles.deleted_at` soft-delete for grace period; hard delete cascades from
`auth.users` → `profiles` (`on delete cascade`) → all owner tables (all FKs to `profiles`
cascade). A `apps/api` job performs the auth-user delete (service role). This gives users the
"delete my data" guarantee §90 requires, with FK cascade ensuring no orphaned personal rows.

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
- **A2** Archived-exercise history reads rely on `apps/api` (service role) for the direct-fetch
  edge case; the common path (join through the owned session) needs no special policy. If a
  pure-client history view must fetch archived globals directly, add
  `sel_archived_in_history` allowing select on `exercises` where the id appears in one of the
  caller's `workout_session_exercises`. Flagged for review.
- No spec contradictions specific to RLS beyond the shared greenfield note (C1).
