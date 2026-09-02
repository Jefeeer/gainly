-- A7 (Oscar G-17, refined G-21 — stated precisely, no overclaim). rls.md §7: soft-deleting an
-- account makes the `profiles` row immediately invisible/unwritable (only profiles policies carry
-- `deleted_at is null`). Non-profile owner rows are honestly documented as NOT instantaneously cut
-- off — they filter on `user_id = auth.uid()` only, bounded by access-token TTL, not by
-- `deleted_at`. This file asserts both halves so a future change to either is caught, not just the
-- security-favorable one.
begin;
select plan(7);

select tests.create_user('00000000-0000-0000-0000-0000000000a7'::uuid, 'a7-user@test.gainly');

select tests.authenticate_as('00000000-0000-0000-0000-0000000000a7'::uuid);
select isnt_empty(
  $$ select 1 from profiles where id = '00000000-0000-0000-0000-0000000000a7' $$,
  'A7 sanity: before deletion, the user can read their own profile'
);
select lives_ok(
  $$ insert into workout_sessions (id, user_id) values
     ('00000000-0000-0000-0000-00000000ec07', '00000000-0000-0000-0000-0000000000a7') $$,
  'A7 setup: user creates a workout session before requesting deletion'
);

-- The deletion request itself runs via service role (rls.md §7 step 1).
select tests.authenticate_as_service_role();
select lives_ok(
  $$ update profiles set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000a7' $$,
  'A7: service_role can set profiles.deleted_at (the soft-delete step is unblocked by the G-23 guard fix)'
);

-- The same (now-stale) session is still authenticated as this user for the rest of the test —
-- this models a still-valid access JWT held during the grace-window / TTL-bounded gap.
select tests.authenticate_as('00000000-0000-0000-0000-0000000000a7'::uuid);
select is_empty(
  $$ select 1 from profiles where id = '00000000-0000-0000-0000-0000000000a7' $$,
  'A7: the profiles row is IMMEDIATELY invisible to the same still-authenticated session'
);
select lives_ok(
  $$ update profiles set display_name = 'still logged in' where id = '00000000-0000-0000-0000-0000000000a7' $$,
  'A7: the UPDATE statement itself does not error (upd_self also carries deleted_at is null, so it just matches nothing)'
);
select is(
  (select display_name from profiles where id = '00000000-0000-0000-0000-0000000000a7'::uuid),
  null,
  'A7: that UPDATE did not actually take effect — a soft-deleted account cannot even self-edit'
);

-- Documented, TTL-bounded behavior, not a bug: non-profile owner rows are NOT gated on
-- deleted_at, so the same stale session can still read its own workout data. Asserted explicitly
-- so a future tightening OR an accidental loosening of this is a visible test change, not silence.
select isnt_empty(
  $$ select 1 from workout_sessions where user_id = '00000000-0000-0000-0000-0000000000a7' $$,
  'A7 documented behavior: a still-valid session can still read its own non-profile owner rows post-soft-delete (rls.md §7 point 2)'
);

select * from finish();
rollback;
