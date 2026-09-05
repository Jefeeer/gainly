-- P1-RLSGAPS MEDIUM-1 (Oscar review): admin_audit_logs had NO test file. rls.md §5 / migration:
--   policy sel_admin: SELECT using is_admin()   -- is_admin() reads profiles.is_admin for auth.uid()
--   NO insert policy  -> rows are written by service_role only
--   revoke insert, update, delete from authenticated, anon
-- The undetectable regression this closes: if sel_admin ever regressed to `using (true)`, EVERY
-- authenticated user could read the entire audit trail and nothing would fire. So the load-bearing
-- assertions are the pair "non-admin reads ZERO" + "admin reads the row" against a row that
-- DEMONSTRABLY EXISTS -- proving the policy gates on is_admin(), not that the table is empty and not
-- that reads are broken for everyone (which would pass a `using (false)` bug).
--
-- Non-obvious but deliberate: an admin can READ the audit log but still cannot WRITE it. is_admin()
-- gates SELECT only; INSERT/UPDATE/DELETE are privilege-revoked for `authenticated` regardless of
-- admin status. Only service_role writes. The admin-INSERT-throws assertion locks that in.
begin;
select plan(8);

select tests.create_user('00000000-0000-0000-0000-00000000ad01'::uuid, 'audit-admin@test.gainly', true);
select tests.create_user('00000000-0000-0000-0000-00000000ad02'::uuid, 'audit-user@test.gainly', false);

-- Seed a real audit row as service_role (the only writer) -- ALSO the inverse: service_role CAN write.
select tests.authenticate_as_service_role();
select lives_ok(
  $$ insert into admin_audit_logs (id, admin_user_id, action, resource_type)
     values ('00000000-0000-0000-0000-00000000ad0e', '00000000-0000-0000-0000-00000000ad01',
             'user.suspend', 'profiles') $$,
  'audit inverse: service_role CAN INSERT an audit row (the sole legitimate writer)'
);

-- The core hole: a NON-admin must read ZERO audit rows. If sel_admin regressed to using(true) this
-- flips red. Checked against the seeded row so a pass cannot be credited to an empty table.
select tests.authenticate_as('00000000-0000-0000-0000-00000000ad02'::uuid);
select is_empty(
  $$ select 1 from admin_audit_logs where id = '00000000-0000-0000-0000-00000000ad0e' $$,
  'audit: non-admin cannot read the audit trail (sel_admin gates on is_admin())'
);

-- Positive control: an admin CAN read it -- proves sel_admin is not simply broken/using(false).
select tests.authenticate_as('00000000-0000-0000-0000-00000000ad01'::uuid);
select isnt_empty(
  $$ select 1 from admin_audit_logs where id = '00000000-0000-0000-0000-00000000ad0e' $$,
  'audit: an admin CAN read the audit trail (positive control for sel_admin)'
);

-- Non-admin cannot forge an audit row (insert privilege revoked -> permission denied throws).
select tests.authenticate_as('00000000-0000-0000-0000-00000000ad02'::uuid);
select throws_ok(
  $$ insert into admin_audit_logs (admin_user_id, action, resource_type)
     values ('00000000-0000-0000-0000-00000000ad02', 'forged.action', 'profiles') $$,
  'audit: non-admin cannot INSERT a forged audit row (privilege revoked)'
);

-- And an ADMIN still cannot write it -- read access does not imply write access; only service_role writes.
select tests.authenticate_as('00000000-0000-0000-0000-00000000ad01'::uuid);
select throws_ok(
  $$ insert into admin_audit_logs (admin_user_id, action, resource_type)
     values ('00000000-0000-0000-0000-00000000ad01', 'admin.forged', 'profiles') $$,
  'audit: even an ADMIN cannot INSERT an audit row (is_admin gates SELECT only, not writes)'
);

-- UPDATE / DELETE also privilege-revoked for the (admin) client -> throws.
select throws_ok(
  $$ update admin_audit_logs set action = 'tampered' where id = '00000000-0000-0000-0000-00000000ad0e' $$,
  'audit: client cannot UPDATE an audit row (privilege revoked)'
);
select throws_ok(
  $$ delete from admin_audit_logs where id = '00000000-0000-0000-0000-00000000ad0e' $$,
  'audit: client cannot DELETE an audit row (privilege revoked)'
);

-- Post-state (020/090 exemplar): an independent service_role re-read proves the seeded row survived
-- every denied client write intact -- not partially updated, not deleted.
select tests.authenticate_as_service_role();
select isnt_empty(
  $$ select 1 from admin_audit_logs where id = '00000000-0000-0000-0000-00000000ad0e' and action = 'user.suspend' $$,
  'audit: the seeded row is intact after all denied client writes (service_role re-read)'
);

select * from finish();
rollback;
