-- A1 (Oscar G-17 CRITICAL, admin self-escalation) + A1b (positive control on the same grant).
-- rls.md §1: `revoke update on profiles from authenticated` then an allow-list grant, backed by
-- a defense-in-depth trigger (guard_profiles_privileged_cols) gated on current_user='authenticated'
-- (G-23 fix) so it does not also block the service-role writes it must permit.
begin;
select plan(7);

select tests.create_user('00000000-0000-0000-0000-0000000000a1'::uuid, 'a1-user@test.gainly');

-- A1: non-admin cannot set is_admin on their own row (column-privilege revoke fires first).
select tests.authenticate_as('00000000-0000-0000-0000-0000000000a1'::uuid);
select throws_ok(
  $$ update profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000a1' $$,
  'A1: non-admin cannot set profiles.is_admin on own row'
);

-- A1: non-admin cannot set deleted_at on their own row (same grant list excludes it).
select throws_ok(
  $$ update profiles set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000a1' $$,
  'A1: non-admin cannot set profiles.deleted_at on own row'
);

-- A1b: the allow-list is not so tight it breaks an ordinary profile edit.
select lives_ok(
  $$ update profiles set display_name = 'A1 Test User' where id = '00000000-0000-0000-0000-0000000000a1' $$,
  'A1b: allow-listed column (display_name) remains editable by its owner'
);
select is(
  (select display_name from profiles where id = '00000000-0000-0000-0000-0000000000a1'::uuid),
  'A1 Test User',
  'A1b: the display_name edit actually took effect, not silently dropped'
);

-- A1 inverse: service_role (the account-deletion job / admin-promotion path) MUST still be able
-- to set both columns. A prior version of this guard blocked exactly these two writes.
select tests.authenticate_as_service_role();
select lives_ok(
  $$ update profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000a1' $$,
  'A1 inverse: service_role CAN set is_admin (admin-promotion path stays functional)'
);
select lives_ok(
  $$ update profiles set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000a1' $$,
  'A1 inverse: service_role CAN set deleted_at (account-deletion job stays functional)'
);
select is(
  (select is_admin from profiles where id = '00000000-0000-0000-0000-0000000000a1'::uuid),
  true,
  'A1 inverse: the service-role is_admin write actually took effect'
);

select * from finish();
rollback;
