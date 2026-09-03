-- G-26 (god ruling, amendment to G-25; FINAL as of G-31). rls.md §1/§5, migration comment at
-- personal_records policy block ("§5 WRITE-RESTRICTED ... ZERO insert/update/delete policies ->
-- default-deny IS the enforcement"): PRs are DERIVED data computed server-side by
-- PersonalRecordService. Owner-writable would let a user fabricate a PR contradicting their own
-- logged sets, with no defined LWW precedence against the server-computed row. Same bug class as
-- A2, second table — this file is the "does the suite catch a third instance" proof god asked for.
--
-- G-31 extends this file with two forgery cases from Oscar's G-28 that a generic denial test would
-- miss, since the pre-fix vulnerability was specifically a SUCCESSFUL write, not an error:
--   1. workout_set_id = NULL sidesteps `pr_dedupe_by_set` (a PARTIAL unique index that excludes
--      NULL) — before this fix, a forged NULL-set PR could be inserted without limit. RLS default-
--      deny must be what actually stops this, not the index (the index never covered this case).
--   2. Inflating an EXISTING own row (value / achieved_at / pr_type together) — this was upd_own
--      before the fix.
-- All denial checks assert POST-STATE, never an exception for UPDATE/DELETE: RLS silently NO-OPS
-- those rather than throwing, so "no exception thrown" alone would be a FALSE PASS.
begin;
select plan(14);

select tests.create_user('00000000-0000-0000-0000-0000000000c6'::uuid, 'g26-user@test.gainly');

select tests.authenticate_as_service_role();
select lives_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source)
     values ('00000000-0000-0000-0000-00000000ec26', 'PR Test Lift', 'pr-test-lift-g26', 'weight_reps', 'gainly') $$,
  'G26 setup: seed a global exercise to attach PRs to'
);

-- Clean INSERT-denial check as the owner — no unique(user_id) confound on this table (unlike
-- subscriptions), so this can run straight against the target user.
select tests.authenticate_as('00000000-0000-0000-0000-0000000000c6'::uuid);
select throws_ok(
  $$ insert into personal_records (user_id, exercise_id, pr_type, value)
     values ('00000000-0000-0000-0000-0000000000c6', '00000000-0000-0000-0000-00000000ec26', 'max_weight', 999) $$,
  'G26: owner cannot INSERT their own personal_records row (fabricated PR, no insert policy grants it)'
);

-- Seed a real PR the way the service (PersonalRecordService) would.
select tests.authenticate_as_service_role();
select lives_ok(
  $$ insert into personal_records (id, user_id, exercise_id, pr_type, value)
     values ('00000000-0000-0000-0000-00000000cd26', '00000000-0000-0000-0000-0000000000c6',
             '00000000-0000-0000-0000-00000000ec26', 'max_weight', 100) $$,
  'G26 setup: service_role can create the owner''s PR row'
);

select tests.authenticate_as('00000000-0000-0000-0000-0000000000c6'::uuid);

-- Positive control: owner can still read their own PR.
select isnt_empty(
  $$ select 1 from personal_records where id = '00000000-0000-0000-0000-00000000cd26' $$,
  'G26 sanity: owner can read their own personal_records row'
);

-- G-31 forgery case 1: workout_set_id = NULL sidesteps pr_dedupe_by_set (partial index excludes
-- NULL) — try it twice, so a pass-for-the-wrong-reason (unique-constraint collision) is ruled out.
select throws_ok(
  $$ insert into personal_records (id, user_id, exercise_id, pr_type, value, workout_set_id)
     values ('00000000-0000-0000-0000-00000000ce26', '00000000-0000-0000-0000-0000000000c6',
             '00000000-0000-0000-0000-00000000ec26', 'max_reps', 500, null) $$,
  'G26: owner cannot INSERT a NULL-workout_set_id PR (dedupe index does not cover this row, RLS must)'
);
select throws_ok(
  $$ insert into personal_records (id, user_id, exercise_id, pr_type, value, workout_set_id)
     values ('00000000-0000-0000-0000-00000000cf26', '00000000-0000-0000-0000-0000000000c6',
             '00000000-0000-0000-0000-00000000ec26', 'max_reps', 501, null) $$,
  'G26: a SECOND NULL-workout_set_id PR is also denied — the partial index would have allowed both, RLS does not'
);
select is(
  (select count(*) from personal_records
     where user_id = '00000000-0000-0000-0000-0000000000c6' and workout_set_id is null)::int,
  0,
  'G26: neither NULL-workout_set_id forgery attempt landed a row'
);

-- G-31 forgery case 2: inflate an EXISTING own row across all three writable fields at once
-- (value / achieved_at / pr_type) — this combination was upd_own before the fix.
select lives_ok(
  $$ update personal_records
       set value = 9999, achieved_at = '2020-01-01'::timestamptz, pr_type = 'max_reps'
     where id = '00000000-0000-0000-0000-00000000cd26' $$,
  'G26: the UPDATE statement itself does not error (RLS denies via zero matched rows, not an exception)'
);
select is(
  (select value from personal_records where id = '00000000-0000-0000-0000-00000000cd26'::uuid),
  100::numeric,
  'G26: owner CANNOT inflate value — still the server-computed 100'
);
select is(
  (select pr_type::text from personal_records where id = '00000000-0000-0000-0000-00000000cd26'::uuid),
  'max_weight',
  'G26: owner CANNOT rewrite pr_type — still the server-computed max_weight'
);
select isnt(
  (select achieved_at from personal_records where id = '00000000-0000-0000-0000-00000000cd26'::uuid),
  '2020-01-01'::timestamptz,
  'G26: owner CANNOT rewrite achieved_at — the forged date did not take'
);

-- Owner cannot DELETE it (e.g. to erase an unwanted record) either.
select lives_ok(
  $$ delete from personal_records where id = '00000000-0000-0000-0000-00000000cd26' $$,
  'G26: the DELETE statement itself does not error'
);
select tests.authenticate_as_service_role();
select isnt_empty(
  $$ select 1 from personal_records where id = '00000000-0000-0000-0000-00000000cd26' $$,
  'G26: the PR row still exists — owner''s DELETE did not actually remove it'
);

-- Inverse: the real write path (service_role, e.g. workout-finish recompute or account deletion
-- cascade) must keep working — a prior guard iteration broke exactly this class of legitimate write.
select lives_ok(
  $$ update personal_records set value = 150 where id = '00000000-0000-0000-0000-00000000cd26' $$,
  'G26 inverse: service_role CAN write personal_records'
);

select * from finish();
rollback;
