-- A4 (Oscar G-17, refined G-21). rls.md §3 foods: ownership policies don't mention is_verified at
-- all (a REVOKE would also block admins, since admins verify via the same `authenticated` role) —
-- the trigger guard_foods_verified blocks non-admin INSERT-with-verified-true and any non-admin
-- is_verified TRANSITION, while leaving every other column owner-editable, including on an
-- already-verified row (the G-21 regression this mechanism exists to fix).
begin;
select plan(8);

select tests.create_user('00000000-0000-0000-0000-0000000000a4'::uuid, 'a4-user@test.gainly');
select tests.create_user('00000000-0000-0000-0000-00000000ad44'::uuid, 'a4-admin@test.gainly', true);

select tests.authenticate_as('00000000-0000-0000-0000-0000000000a4'::uuid);

-- A4: a non-admin cannot INSERT a food that is already verified.
select throws_ok(
  $$ insert into foods (name, created_by, is_verified)
     values ('Sketchy Protein Bar', '00000000-0000-0000-0000-0000000000a4', true) $$,
  'A4: non-admin cannot INSERT a food with is_verified = true'
);

-- Sanity: an ordinary (unverified) insert by the owner works.
select lives_ok(
  $$ insert into foods (id, name, created_by)
     values ('00000000-0000-0000-0000-0000000f00d4', 'Homemade Oatmeal', '00000000-0000-0000-0000-0000000000a4') $$,
  'A4 setup: owner can insert an ordinary unverified food'
);

-- A4: a non-admin cannot flip their own food's is_verified via UPDATE either.
select throws_ok(
  $$ update foods set is_verified = true where id = '00000000-0000-0000-0000-0000000f00d4' $$,
  'A4: non-admin cannot UPDATE-transition is_verified false -> true on their own food'
);

-- Admin verifies it (the legitimate path).
select tests.authenticate_as('00000000-0000-0000-0000-00000000ad44'::uuid);
select lives_ok(
  $$ update foods set is_verified = true where id = '00000000-0000-0000-0000-0000000f00d4' $$,
  'A4 setup: admin CAN verify the food'
);

-- A4 — the regression this whole mechanism exists to prevent: owner can still edit other fields
-- of their now-verified food.
select tests.authenticate_as('00000000-0000-0000-0000-0000000000a4'::uuid);
select lives_ok(
  $$ update foods set name = 'Homemade Oatmeal (large)' where id = '00000000-0000-0000-0000-0000000f00d4' $$,
  'A4: owner CAN still edit other fields of a food an admin has verified'
);
select is(
  (select name from foods where id = '00000000-0000-0000-0000-0000000f00d4'::uuid),
  'Homemade Oatmeal (large)',
  'A4: that edit actually took effect'
);

-- A4: but the owner still cannot un-verify it via the same or a later update.
select throws_ok(
  $$ update foods set is_verified = false where id = '00000000-0000-0000-0000-0000000f00d4' $$,
  'A4: non-admin cannot UPDATE-transition is_verified true -> false either'
);
select is(
  (select is_verified from foods where id = '00000000-0000-0000-0000-0000000f00d4'::uuid),
  true,
  'A4: is_verified is still true after the blocked un-verify attempt'
);

select * from finish();
rollback;
