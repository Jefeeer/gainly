-- G-26 (god ruling, amendment to G-25). rls.md §1/§5: personal_records moved OUT of the generic
-- owner-write pattern into the same SELECT-own / service-role-only-write shape as subscriptions
-- (A2) — PRs are DERIVED data computed server-side by PersonalRecordService; owner-writable would
-- let a user fabricate a PR contradicting their own logged sets, with no defined LWW precedence
-- against the server-computed row. Same bug class as A2, second table — this file is the "does
-- the suite catch a third instance" proof god asked for.
begin;
select plan(8);

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

-- Attempted fabrication via UPDATE: owner tries to inflate their existing PR.
select lives_ok(
  $$ update personal_records set value = 9999 where id = '00000000-0000-0000-0000-00000000cd26' $$,
  'G26: the UPDATE statement itself does not error (RLS denies via zero matched rows, not an exception)'
);
select is(
  (select value from personal_records where id = '00000000-0000-0000-0000-00000000cd26'::uuid),
  100::numeric,
  'G26: owner CANNOT write their own personal_records row — value is still the server-computed 100'
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

select * from finish();
rollback;
