-- Section 8 (Dwight G-3/G-14, god-ratified). rls.md §8: the WG-sync invariant ("a sync may only
-- create/modify exercises rows with source='workout_guide', never user data") is enforced by a
-- trigger (enforce_wg_sync_scope) — not RLS — because the importer runs as service_role, which
-- bypasses RLS entirely; a trigger fires regardless of role. Two guards: (1) always-on source
-- immutability on UPDATE, for every actor; (2) flag-gated import-scope check inside a txn that
-- sets `app.import_context = 'workout_guide'`. A separate always-on CHECK constraint
-- (exercises_wg_source_is_library) closes the INSERT hole guard 1/2 don't cover.
--
-- The import-context flag is set with a top-level `select set_config(...)` before each assertion
-- rather than embedded inside the throws_ok/lives_ok SQL string — set_config(..., true) is
-- transaction-local (SET LOCAL semantics) and is visible to the nested subtransaction pgTAP's
-- assertion functions open, so this reads cleanly and avoids relying on multi-statement dynamic
-- SQL inside EXECUTE.
--
-- Test IDs (T1-T7) and the ✗->✓ marks are Dwight's, copied verbatim from rls.md §8 so a failure
-- here can be matched straight back to the spec that named it.
begin;
select plan(11);

select tests.create_user('00000000-0000-0000-0000-00000000bd08'::uuid, 'wg-user@test.gainly');

-- Fixture: an ordinary user-owned exercise (source='user') to attack in T1/T2, and a
-- workout_guide-owned one to exercise the legitimate importer path in T3/T5/T6.
select tests.authenticate_as('00000000-0000-0000-0000-00000000bd08'::uuid);
select lives_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source, created_by, is_custom)
     values ('00000000-0000-0000-0000-00000000be0a', 'User Owned Lift', 'user-owned-lift-wg',
             'weight_reps', 'user', '00000000-0000-0000-0000-00000000bd08', true) $$,
  'WG setup: seed a normal user-owned exercise (source=user)'
);

select tests.authenticate_as_service_role();
select lives_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source, created_by)
     values ('00000000-0000-0000-0000-00000000be0b', 'WG Library Lift', 'wg-library-lift',
             'weight_reps', 'workout_guide', null) $$,
  'WG setup: seed a workout_guide-owned exercise the way the real importer would'
);

-- T1 (the live hole — source-flip hijack): inside an import txn, flipping a user row's source to
-- workout_guide must throw. Pre-fix this passed silently (the guard's coalesce saw only NEW).
select set_config('app.import_context', 'workout_guide', true);
select throws_ok(
  $$ update exercises set source = 'workout_guide' where id = '00000000-0000-0000-0000-00000000be0a' $$,
  'T1 (source-flip hijack, ✗->✓): import txn cannot flip a user row''s source to workout_guide'
);

-- T2 (source immutability, no import context): as a normal authenticated user with NO import
-- flag set, source is still immutable on UPDATE. Pre-fix this was allowed (guard inert without
-- the flag).
select set_config('app.import_context', '', true);
select tests.authenticate_as('00000000-0000-0000-0000-00000000bd08'::uuid);
select throws_ok(
  $$ update exercises set source = 'gainly' where id = '00000000-0000-0000-0000-00000000be0a' $$,
  'T2 (source immutability, no flag, ✗->✓): source cannot change even outside an import txn'
);

-- T3 (importer's real pattern): inside an import txn, updating a workout_guide row's ordinary
-- fields (source unchanged) must succeed.
select tests.authenticate_as_service_role();
select set_config('app.import_context', 'workout_guide', true);
select lives_ok(
  $$ update exercises set name = 'WG Library Lift (updated)' where id = '00000000-0000-0000-0000-00000000be0b' $$,
  'T3: import txn CAN update a workout_guide row''s ordinary fields, source unchanged'
);

-- T4: inside an import txn, INSERT source=workout_guide succeeds; INSERT source=user throws
-- (guard 2).
select lives_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source, created_by)
     values ('00000000-0000-0000-0000-00000000be0c', 'WG New Import', 'wg-new-import',
             'weight_reps', 'workout_guide', null) $$,
  'T4a: import txn CAN insert a source=workout_guide row'
);
select throws_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source, created_by, is_custom)
     values ('00000000-0000-0000-0000-00000000be0d', 'Sneaky Insert', 'sneaky-insert-wg',
             'weight_reps', 'user', '00000000-0000-0000-0000-00000000bd08', true) $$,
  'T4b: import txn CANNOT insert a source=user row (guard 2)'
);

-- T5: inside an import txn, DELETE of a workout_guide row succeeds; DELETE of a user row throws
-- (guard 2's DELETE branch reads OLD).
select lives_ok(
  $$ delete from exercises where id = '00000000-0000-0000-0000-00000000be0c' $$,
  'T5a: import txn CAN delete a source=workout_guide row'
);
select throws_ok(
  $$ delete from exercises where id = '00000000-0000-0000-0000-00000000be0a' $$,
  'T5b: import txn CANNOT delete a source=user row (guard 2 DELETE branch)'
);

-- T6 (defect-1 regression): with NO import context, deleting any exercise must not raise a
-- "record NEW is not assigned" error — the function must never read NEW on DELETE.
select set_config('app.import_context', '', true);
select lives_ok(
  $$ delete from exercises where id = '00000000-0000-0000-0000-00000000be0b' $$,
  'T6: a plain DELETE with no import context lives (function never reads NEW on DELETE)'
);

-- T7 (INSERT assertion, Oscar A3): as a normal authenticated user with NO import context,
-- inserting source=workout_guide must throw (exercises_wg_source_is_library CHECK). Neither
-- trigger guard fires on a plain user INSERT — the CHECK constraint is the mechanism under test.
select tests.authenticate_as('00000000-0000-0000-0000-00000000bd08'::uuid);
select throws_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source, created_by, is_custom)
     values ('00000000-0000-0000-0000-00000000be0e', 'Impersonating WG', 'impersonating-wg',
             'weight_reps', 'workout_guide', '00000000-0000-0000-0000-00000000bd08', true) $$,
  'T7 (INSERT hole, ✗->✓): a normal user cannot INSERT a source=workout_guide row (exercises_wg_source_is_library)'
);

select * from finish();
rollback;
