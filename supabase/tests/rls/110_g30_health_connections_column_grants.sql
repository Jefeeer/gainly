-- G-30 (Dwight): health_connections locks last_synced_at and scopes to service-role-only, on BOTH
-- insert and update -- Dwight correctly extended the revoke to insert too, because an update-only
-- revoke would still let a user set scopes on their FIRST write. is_enabled stays user-writable on
-- both ops; user_id/provider are insert-allow-listed because the ins_own RLS policy needs them.
--
-- Same column-GRANT nuance as 100_g30_workout_sessions_column_grants.sql: a column-privilege
-- violation RAISES `permission denied`, it does not silently no-op like RLS -- throws_ok is correct
-- here. Kept one post-state check anyway (assertion 5) so a pass can't be credited to the wrong
-- mechanism.
begin;
select plan(10);

select tests.create_user('00000000-0000-0000-0000-0000000000e0'::uuid, 'g30-hc-user@test.gainly');
select tests.authenticate_as('00000000-0000-0000-0000-0000000000e0'::uuid);

-- The insert allow-list (user_id, provider, is_enabled) still supports the ordinary connect flow.
select lives_ok(
  $$ insert into health_connections (id, user_id, provider, is_enabled)
     values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e0',
             'apple_health', true) $$,
  'G30: authenticated user CAN INSERT their own health_connections row via the allow-listed columns'
);

-- Owner cannot smuggle scopes or last_synced_at in on the INSERT itself.
select throws_ok(
  $$ insert into health_connections (user_id, provider, scopes)
     values ('00000000-0000-0000-0000-0000000000e0', 'android_health', array['read_steps']) $$,
  'G30: owner cannot INSERT with scopes set (not in the insert allow-list)'
);
select throws_ok(
  $$ insert into health_connections (user_id, provider, last_synced_at)
     values ('00000000-0000-0000-0000-0000000000e0', 'android_health', now()) $$,
  'G30: owner cannot INSERT with last_synced_at set (not in the insert allow-list)'
);

-- Owner cannot write either restricted column on UPDATE either (the reason G-30 extended the
-- revoke to insert too -- update-only would have left a first-write hole).
select throws_ok(
  $$ update health_connections set scopes = array['read_steps'] where id = '00000000-0000-0000-0000-0000000000e1' $$,
  'G30: owner cannot UPDATE health_connections.scopes'
);
select is(
  (select scopes from health_connections where id = '00000000-0000-0000-0000-0000000000e1'::uuid),
  '{}'::text[],
  'G30: scopes still the default empty array after the denied update -- the throw actually blocked the write'
);
select throws_ok(
  $$ update health_connections set last_synced_at = now() where id = '00000000-0000-0000-0000-0000000000e1' $$,
  'G30: owner cannot UPDATE health_connections.last_synced_at'
);

-- The fix must not cut too deep: the owner's actual write surface (is_enabled) still works.
select lives_ok(
  $$ update health_connections set is_enabled = false where id = '00000000-0000-0000-0000-0000000000e1' $$,
  'G30: owner CAN still write is_enabled'
);
select is(
  (select is_enabled from health_connections where id = '00000000-0000-0000-0000-0000000000e1'::uuid),
  false,
  'G30: the is_enabled edit actually took effect'
);

-- Inverse: the health sync job (service_role) must still be able to write scopes/last_synced_at.
select tests.authenticate_as_service_role();
select lives_ok(
  $$ update health_connections set scopes = array['read_steps','read_heart_rate'], last_synced_at = now()
     where id = '00000000-0000-0000-0000-0000000000e1' $$,
  'G30 inverse: service_role CAN write scopes and last_synced_at (health sync job stays functional)'
);
select is(
  (select scopes from health_connections where id = '00000000-0000-0000-0000-0000000000e1'::uuid),
  array['read_steps','read_heart_rate']::text[],
  'G30 inverse: the service-role scopes write actually took effect'
);

select * from finish();
rollback;
