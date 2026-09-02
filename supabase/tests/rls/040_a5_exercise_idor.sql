-- A5 (Oscar G-17, refined twice — G-21's second fix is the one that must hold). The highest-value
-- test in the suite per god's brief: this hole was closed twice and the first fix made it worse.
--
-- Attack: user B learns user A's private custom exercise id (leaked via any surface that returns
-- uuids — a shared template, a PR feed, whatever). B inserts a workout_session_exercises row in
-- B's OWN session that references A's exercise_id (the FK to exercises(id) does not itself check
-- RLS, so this insert succeeds — that's not the bug). B then selects `exercises` directly by that
-- id. If ANY exercises policy matches, B has read A's private data. It must return ZERO rows.
--
-- The over-narrowing risk (also asserted here): the fix that closes this must not also hide a
-- legitimately-visible ARCHIVED GLOBAL exercise from a user's own history, or an ACTIVE GLOBAL
-- exercise at all.
begin;
select plan(12);

select tests.create_user('00000000-0000-0000-0000-0000000000a5'::uuid, 'a5-user-a@test.gainly');
select tests.create_user('00000000-0000-0000-0000-0000000000b5'::uuid, 'a5-user-b@test.gainly');

-- User A creates a private custom exercise.
select tests.authenticate_as('00000000-0000-0000-0000-0000000000a5'::uuid);
select lives_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source, created_by, is_custom)
     values ('00000000-0000-0000-0000-00000000ea05', 'A''s Secret Lift', 'as-secret-lift',
             'weight_reps', 'user', '00000000-0000-0000-0000-0000000000a5', true) $$,
  'A5 setup: user A creates their own private custom exercise'
);

-- User B creates their own workout session, then plants a reference to A's exercise in it.
select tests.authenticate_as('00000000-0000-0000-0000-0000000000b5'::uuid);
select lives_ok(
  $$ insert into workout_sessions (id, user_id) values
     ('00000000-0000-0000-0000-00000000ec05', '00000000-0000-0000-0000-0000000000b5') $$,
  'A5 setup: user B creates their own workout session'
);
select lives_ok(
  $$ insert into workout_session_exercises (session_id, exercise_id, position)
     values ('00000000-0000-0000-0000-00000000ec05', '00000000-0000-0000-0000-00000000ea05', 1) $$,
  'A5 setup: user B can plant A''s exercise_id into their OWN session (own_via_session only checks session ownership — this is the setup, not the leak)'
);

-- The actual assertion: B selecting A's exercise directly must return nothing.
select is_empty(
  $$ select 1 from exercises where id = '00000000-0000-0000-0000-00000000ea05' $$,
  'A5: cross-user IDOR — user B selecting user A''s private custom exercise by id returns ZERO rows'
);

-- B cannot write it either (upd_own_custom requires created_by = B).
select lives_ok(
  $$ update exercises set name = 'Hijacked' where id = '00000000-0000-0000-0000-00000000ea05' $$,
  'A5: the UPDATE statement itself does not error (RLS denies via zero matched rows)'
);

select tests.authenticate_as_service_role();
select is(
  (select name from exercises where id = '00000000-0000-0000-0000-00000000ea05'::uuid),
  'A''s Secret Lift',
  'A5: user B''s UPDATE did not actually rename A''s exercise'
);

-- Over-narrowing check #1: an ACTIVE GLOBAL exercise is plainly readable by anyone (sel_active_public).
select lives_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source, created_by, is_active)
     values ('00000000-0000-0000-0000-00000000ea06', 'Global Active Lift', 'global-active-lift',
             'weight_reps', 'gainly', null, true) $$,
  'A5 setup: service_role seeds an active global library exercise'
);
select tests.authenticate_as('00000000-0000-0000-0000-0000000000b5'::uuid);
select isnt_empty(
  $$ select 1 from exercises where id = '00000000-0000-0000-0000-00000000ea06' $$,
  'A5 regression guard: an ACTIVE GLOBAL exercise IS still readable by any user'
);

-- Over-narrowing check #2: the real reason sel_archived_in_history exists — an exercise B actually
-- used while it was active, later archived by an admin, must stay readable inside B's own history.
select tests.authenticate_as_service_role();
select lives_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source, created_by, is_active)
     values ('00000000-0000-0000-0000-00000000ea07', 'Discontinued Lift', 'discontinued-lift',
             'weight_reps', 'gainly', null, true) $$,
  'A5 setup: seed a second global exercise, still active for now'
);
select tests.authenticate_as('00000000-0000-0000-0000-0000000000b5'::uuid);
select lives_ok(
  $$ insert into workout_session_exercises (session_id, exercise_id, position)
     values ('00000000-0000-0000-0000-00000000ec05', '00000000-0000-0000-0000-00000000ea07', 2) $$,
  'A5 setup: user B genuinely logs it into their own session while it is still active'
);
select tests.authenticate_as_service_role();
select lives_ok(
  $$ update exercises set is_active = false where id = '00000000-0000-0000-0000-00000000ea07' $$,
  'A5 setup: an admin later archives that exercise'
);
select tests.authenticate_as('00000000-0000-0000-0000-0000000000b5'::uuid);
select isnt_empty(
  $$ select 1 from exercises where id = '00000000-0000-0000-0000-00000000ea07' $$,
  'A5 regression guard: user B can still read the now-archived exercise INSIDE their own history (sel_archived_in_history)'
);

select * from finish();
rollback;
