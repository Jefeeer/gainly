-- P1-RLSGAPS MEDIUM-1 (Oscar review): analytics_events had NO test file. rls.md §5 / migration:
--   policy ins_own: INSERT with check (user_id = auth.uid() OR user_id IS NULL)  -- pre-auth telemetry
--   NO select policy at all  -> clients can never READ analytics (default-deny SELECT = zero rows)
--   revoke update, delete from authenticated, anon  -> only INSERT is a client privilege
-- The undetectable regression this closes: if a stray SELECT policy were ever added to this table,
-- all telemetry would leak cross-user and nothing tests it. So the load-bearing assertions here are
-- the two is_empty SELECT checks against a row that DEMONSTRABLY EXISTS (seeded via service_role) --
-- proving the absence-of-select-policy hides it, not that the table is simply empty.
--
-- Two denial SHAPES coexist on this table, asserted with the matching tool:
--   * cross-user INSERT (user_id = someone else) violates the ins_own WITH CHECK -> THROWS.
--   * UPDATE/DELETE are table-privilege REVOKES -> THROW `permission denied` (not a silent no-op).
--   * SELECT has no policy -> returns ZERO ROWS silently (is_empty), never throws.
begin;
select plan(8);

select tests.create_user('00000000-0000-0000-0000-00000000ea01'::uuid, 'analytics-a@test.gainly');
select tests.create_user('00000000-0000-0000-0000-00000000ea02'::uuid, 'analytics-b@test.gainly');

-- Positive control: a client CAN log its own telemetry (ins_own allows user_id = self). Revoking
-- INSERT would kill client analytics, so this must keep working.
select tests.authenticate_as('00000000-0000-0000-0000-00000000ea01'::uuid);
select lives_ok(
  $$ insert into analytics_events (user_id, event) values ('00000000-0000-0000-0000-00000000ea01', 'app_open') $$,
  'analytics: authenticated user CAN INSERT their own event (ins_own, telemetry stays functional)'
);

-- Cross-user INSERT forgery: user A stamping an event as user B violates ins_own WITH CHECK -> throws.
select throws_ok(
  $$ insert into analytics_events (user_id, event) values ('00000000-0000-0000-0000-00000000ea02', 'forged') $$,
  'analytics: user A cannot INSERT an event attributed to user B (ins_own WITH CHECK)'
);

-- Seed a real, known event as service_role (the row the read checks must fail to see). This ALSO is
-- the inverse: service_role (analytics aggregation job) CAN write.
select tests.authenticate_as_service_role();
select lives_ok(
  $$ insert into analytics_events (id, user_id, event)
     values ('00000000-0000-0000-0000-00000000ea0e', '00000000-0000-0000-0000-00000000ea01', 'seeded') $$,
  'analytics inverse: service_role CAN INSERT (aggregation job writer stays functional)'
);

-- The core hole: NO select policy exists, so NOBODY authenticated may read -- not another user...
select tests.authenticate_as('00000000-0000-0000-0000-00000000ea02'::uuid);
select is_empty(
  $$ select 1 from analytics_events where id = '00000000-0000-0000-0000-00000000ea0e' $$,
  'analytics: user B cannot read the seeded event -- cross-user telemetry does not leak'
);
-- ...not even the row's OWN user. Analytics is write-only for every client. This is the assertion a
-- stray `create policy ... for select` would flip red.
select tests.authenticate_as('00000000-0000-0000-0000-00000000ea01'::uuid);
select is_empty(
  $$ select 1 from analytics_events where id = '00000000-0000-0000-0000-00000000ea0e' $$,
  'analytics: even the owning user cannot SELECT analytics_events (no select policy at all)'
);

-- UPDATE / DELETE are table-privilege revokes -> permission denied (throws), not a silent no-op.
select throws_ok(
  $$ update analytics_events set event = 'tampered' where id = '00000000-0000-0000-0000-00000000ea0e' $$,
  'analytics: client cannot UPDATE analytics_events (privilege revoked)'
);
select throws_ok(
  $$ delete from analytics_events where id = '00000000-0000-0000-0000-00000000ea0e' $$,
  'analytics: client cannot DELETE analytics_events (privilege revoked)'
);

-- Post-state / inverse: the row survived every denied client write, and service_role CAN read it.
select tests.authenticate_as_service_role();
select isnt_empty(
  $$ select 1 from analytics_events where id = '00000000-0000-0000-0000-00000000ea0e' and event = 'seeded' $$,
  'analytics: the seeded row is intact and service_role CAN read it (nothing tampered or deleted)'
);

select * from finish();
rollback;
