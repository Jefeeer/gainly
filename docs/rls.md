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
`health_connections`, `workout_sessions`, `personal_records`†, `workout_templates`* , `programs`.

> **`subscriptions` is deliberately NOT here** — A2 FIX (Oscar G-17 CRITICAL). Under this generic
> owner pattern a user could `update subscriptions set plan='pro', status='active',
> current_period_end='2099-01-01' where user_id=auth.uid()` and RLS would allow it → free Pro,
> and any server-side Pro gate reading this table is defeated. It is now **SELECT-own only, all
> writes via service role** (Stripe webhook) — see §5.
>
> **†`personal_records` is user-writable here, which lets a user fabricate PRs.** Self-only vanity
> data (low severity), but it contradicts PR detection being server-side business logic
> (`workout-semantics.md`, `database.md §10`). **Flagged for Dwight** — if PR writes should be
> service-role-only too, move `personal_records` to the §5 shape. Not changed here (his call).

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
-- future policy — this column REVOKE is the primary, durable control (prose is not a control):
revoke update (is_admin)   on profiles from authenticated;  -- promotion is service-role-only
revoke update (deleted_at) on profiles from authenticated;  -- user can't self-undelete past grace

-- Defense-in-depth trigger (the revoke above is primary; this also catches a mistaken re-GRANT):
create or replace function guard_profiles_privileged_cols() returns trigger
language plpgsql as $$
begin
  if new.is_admin is distinct from old.is_admin and not is_admin() then
    raise exception 'is_admin is not self-writable';
  end if;
  return new;
end $$;
create trigger trg_guard_profiles_privileged before update on profiles
  for each row execute function guard_profiles_privileged_cols();
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
-- A5 FIX (Oscar G-17): direct fetch of an archived exercise in history — scoped to exercises that
-- appear in the CALLER'S OWN sessions. Deletes the service-role resolver (an IDOR: fetch-by-id via
-- service role bypasses RLS and could return another user's PRIVATE custom exercise). This policy
-- exposes only exercises the caller actually used, archived-global or otherwise.
create policy sel_archived_in_history on exercises for select
  using (exists (select 1 from workout_session_exercises se
                 join workout_sessions s on s.id = se.session_id
                 where se.exercise_id = exercises.id and s.user_id = auth.uid()));
```
Archived global exercises (`is_active=false`, `created_by is null`) stay readable **inside
history** two ways: the common path joins through the owned session (no fresh `exercises` select),
and a direct fetch-by-id is covered by `sel_archived_in_history` above. **No service-role resolver
is used** for this (§87 L2892) — that path was an IDOR and is removed from `api.md`.

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
-- A4 FIX (Oscar G-17): sel_catalog_or_own exposes is_verified rows to EVERYONE, and without the
-- `is_verified is not true` guard a user could `update foods set is_verified=true` to publish their
-- own food into the global trusted catalog. Column REVOKE is wrong here (admins verify via the same
-- `authenticated` role, so a revoke would block them too) — instead force the column false in the
-- USER policies and let `admin_all` (is_admin()) be the only path that sets it true.
-- (`foods.is_verified` already `not null default false` in database.md:447, so INSERT defaults safe.)
create policy ins_own on foods for insert
  with check (created_by = auth.uid() and is_verified is not true);
create policy upd_own on foods for update using (created_by = auth.uid())
                                     with check (created_by = auth.uid() and is_verified is not true);
create policy admin_all on foods for all using (is_admin()) with check (is_admin()); -- only admins verify
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

-- subscriptions: A2 FIX (Oscar G-17 CRITICAL — free Pro). SELECT-own only; NO insert/update/delete
-- policy → clients cannot write. plan/status/period are set ONLY by the Stripe webhook via service
-- role (which bypasses RLS). Moved out of §1 so the generic owner pattern cannot re-grant writes.
create policy sel_own on subscriptions for select using (user_id = auth.uid());
-- (no ins/upd/del policy → any client write is denied by default-deny)
```

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

---

## 7. Account deletion (§90 L2938) — decision D-a (see `database.md §13`)

Two-step, **hard-delete wins for the account** (§90) while *content* soft-deletes (§87):
1. **Soft window:** on user request, revoke the refresh token + set `profiles.deleted_at`. The
   `and deleted_at is null` clause in the profiles policies (§1) makes the account's data
   immediately **unreadable** via RLS. A7 correction (Oscar G-17): the access JWT is **stateless
   and stays valid until its TTL** — deletion is not instantaneously "unauthenticable." What
   actually happens: refresh is revoked so no new access token is minted, and the short access-token
   TTL bounds the residual window; during it, RLS already returns zero rows for the account, so no
   private data is served. Not a loophole, but stated honestly.
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
