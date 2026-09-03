-- G-30 (Dwight): workout_sessions locks 5 server-computed cached aggregates (duration_seconds,
-- total_sets, completed_sets, total_reps, total_volume) behind a column-privilege revoke, while the
-- 8 user-owned columns (name, notes, status, started_at, ended_at, template_id, program_day_id,
-- client_uuid) stay writable. INSERT is untouched by G-30 -- session creation must still work.
--
-- NUANCE vs the personal_records (A2-class) files: this is a COLUMN GRANT, not an RLS policy. A
-- column-privilege violation RAISES `permission denied for table workout_sessions`, it does NOT
-- silently no-op like RLS does -- so throws_ok is the correct (not the wrong) assertion here. Kept
-- one post-state check anyway (assertion 4) so a pass can't be credited to the wrong mechanism.
begin;
select plan(9);

select tests.create_user('00000000-0000-0000-0000-0000000000d0'::uuid, 'g30-ws-user@test.gainly');
select tests.authenticate_as('00000000-0000-0000-0000-0000000000d0'::uuid);

-- INSERT is deliberately untouched by G-30 -- users must still be able to create a session.
select lives_ok(
  $$ insert into workout_sessions (id, user_id, name)
     values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d0', 'Leg Day') $$,
  'G30: authenticated user CAN still INSERT a workout_sessions row (creation is unaffected)'
);

-- Owner cannot write either of two representative cached aggregates (revoked column privilege
-- fires regardless of which one is targeted -- these two stand in for all 5).
select throws_ok(
  $$ update workout_sessions set duration_seconds = 9999 where id = '00000000-0000-0000-0000-0000000000d1' $$,
  'G30: owner cannot write workout_sessions.duration_seconds (server-computed cached aggregate)'
);
select throws_ok(
  $$ update workout_sessions set total_volume = 99999 where id = '00000000-0000-0000-0000-0000000000d1' $$,
  'G30: owner cannot write workout_sessions.total_volume (server-computed cached aggregate)'
);
select is(
  (select duration_seconds from workout_sessions where id = '00000000-0000-0000-0000-0000000000d1'::uuid),
  null::int,
  'G30: duration_seconds still unset after both denied attempts -- the throw actually blocked the write'
);

-- The fix must not cut too deep: a real "finish this workout" edit touching several owned columns
-- at once still works.
select lives_ok(
  $$ update workout_sessions
       set name = 'Leg Day (done)', notes = 'felt strong', status = 'completed', ended_at = now()
     where id = '00000000-0000-0000-0000-0000000000d1' $$,
  'G30: owner CAN still write the user-owned columns (name/notes/status/ended_at) together'
);
select is(
  (select name from workout_sessions where id = '00000000-0000-0000-0000-0000000000d1'::uuid),
  'Leg Day (done)',
  'G30: the name edit actually took effect'
);
select is(
  (select status from workout_sessions where id = '00000000-0000-0000-0000-0000000000d1'::uuid),
  'completed',
  'G30: the status edit actually took effect'
);

-- Inverse: the workout-finish recompute job (service_role) must still be able to write the
-- aggregates it owns.
select tests.authenticate_as_service_role();
select lives_ok(
  $$ update workout_sessions set duration_seconds = 2400, total_volume = 5000
     where id = '00000000-0000-0000-0000-0000000000d1' $$,
  'G30 inverse: service_role CAN write the cached aggregates (finish-recompute job stays functional)'
);
select is(
  (select duration_seconds from workout_sessions where id = '00000000-0000-0000-0000-0000000000d1'::uuid),
  2400,
  'G30 inverse: the service-role aggregate write actually took effect'
);

select * from finish();
rollback;
