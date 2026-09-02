-- A2 (Oscar G-17 CRITICAL, free Pro). rls.md §5: subscriptions is SELECT-own only; NO
-- insert/update/delete policy, so every client write is denied by RLS's default-deny (not by an
-- explicit blocking policy — there simply is none). Only service_role (the Stripe webhook) may
-- write. UPDATE/DELETE without a matching policy affect ZERO rows rather than throwing, so those
-- two are asserted by "value unchanged" rather than throws_ok; INSERT with no matching policy
-- DOES throw (WITH CHECK has nothing to satisfy).
--
-- Uses two users: a2b's INSERT-denial is checked first, while they have NO existing row —
-- `subscriptions` also carries `unique(user_id)`, so testing INSERT-denial against a user who
-- already has a row (a2) would be confounded by that unique constraint and could pass even if
-- the RLS policy were accidentally reopened. a2 is used for the seeded-row UPDATE/DELETE checks.
begin;
select plan(9);

select tests.create_user('00000000-0000-0000-0000-0000000000a2'::uuid, 'a2-user@test.gainly');
select tests.create_user('00000000-0000-0000-0000-0000000000b2'::uuid, 'a2-user-b@test.gainly');

-- Clean INSERT-denial check, before either user has a row (no unique(user_id) confound).
select tests.authenticate_as('00000000-0000-0000-0000-0000000000b2'::uuid);
select throws_ok(
  $$ insert into subscriptions (user_id, provider, plan, status)
     values ('00000000-0000-0000-0000-0000000000b2', 'apple', 'pro_monthly', 'active') $$,
  'A2: owner cannot INSERT their own subscriptions row (no insert policy grants it)'
);

-- Seed: only service_role can create the row at all (matches production: webhook creates it).
select tests.authenticate_as_service_role();
select lives_ok(
  $$ insert into subscriptions (user_id, provider, plan, status)
     values ('00000000-0000-0000-0000-0000000000a2', 'stripe', 'free', 'active') $$,
  'A2 setup: service_role can create the owner''s subscription row'
);

select tests.authenticate_as('00000000-0000-0000-0000-0000000000a2'::uuid);

-- Positive control: the owner can still SELECT their own row.
select isnt_empty(
  $$ select 1 from subscriptions where user_id = '00000000-0000-0000-0000-0000000000a2' $$,
  'A2 sanity: owner can read their own subscription row'
);

-- The attack literally described in rls.md's comment: self-upgrade to Pro.
select lives_ok(
  $$ update subscriptions set plan = 'pro_annual', status = 'active',
       current_period_end = '2099-01-01' where user_id = '00000000-0000-0000-0000-0000000000a2' $$,
  'A2: the UPDATE statement itself does not error (RLS denies via zero matched rows, not an exception)'
);
select is(
  (select plan from subscriptions where user_id = '00000000-0000-0000-0000-0000000000a2'::uuid),
  'free',
  'A2: owner CANNOT write their own subscriptions row — plan is still ''free'' after the attempted self-upgrade'
);

-- DELETE as owner: same zero-rows-affected shape as UPDATE.
select lives_ok(
  $$ delete from subscriptions where user_id = '00000000-0000-0000-0000-0000000000a2' $$,
  'A2: the DELETE statement itself does not error'
);

select tests.authenticate_as_service_role();
select isnt_empty(
  $$ select 1 from subscriptions where user_id = '00000000-0000-0000-0000-0000000000a2' $$,
  'A2: the row still exists — owner''s DELETE did not actually remove it'
);

-- Inverse: the actual webhook path must keep working.
select lives_ok(
  $$ update subscriptions set plan = 'pro_monthly', status = 'active'
     where user_id = '00000000-0000-0000-0000-0000000000a2' $$,
  'A2 inverse: service_role (the Stripe webhook) CAN write plan/status'
);
select is(
  (select plan from subscriptions where user_id = '00000000-0000-0000-0000-0000000000a2'::uuid),
  'pro_monthly',
  'A2 inverse: the service-role write actually took effect'
);

select * from finish();
rollback;
