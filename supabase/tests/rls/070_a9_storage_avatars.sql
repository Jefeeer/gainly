-- A9 (Oscar G-17). rls.md §6: avatars is a private bucket, owner-only via the object key's FIRST
-- path segment — spelled out for all four verbs with `with check` on write, because without it a
-- user can write into another user's folder. Objects must be keyed `<uid>/filename`.
begin;
select plan(9);

select tests.create_user('00000000-0000-0000-0000-0000000000a9'::uuid, 'a9-user-a@test.gainly');
select tests.create_user('00000000-0000-0000-0000-0000000000b9'::uuid, 'a9-user-b@test.gainly');

select tests.authenticate_as('00000000-0000-0000-0000-0000000000a9'::uuid);

-- Positive: A can insert into their own prefix.
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('avatars', '00000000-0000-0000-0000-0000000000a9/me.jpg', '00000000-0000-0000-0000-0000000000a9') $$,
  'A9: user A can INSERT an object under their own avatars/{uid}/ prefix'
);

-- A9: A cannot write into B's folder.
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('avatars', '00000000-0000-0000-0000-0000000000b9/evil.jpg', '00000000-0000-0000-0000-0000000000a9') $$,
  'A9: user A cannot INSERT an object into user B''s avatars/{uid}/ prefix'
);

select tests.authenticate_as('00000000-0000-0000-0000-0000000000b9'::uuid);

-- A9: B cannot SELECT A's avatar object.
select is_empty(
  $$ select 1 from storage.objects
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-0000000000a9/me.jpg' $$,
  'A9: user B cannot SELECT user A''s avatar object'
);

-- A9: B cannot UPDATE A's avatar object.
select lives_ok(
  $$ update storage.objects set metadata = '{"hacked":true}'::jsonb
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-0000000000a9/me.jpg' $$,
  'A9: the UPDATE statement itself does not error (RLS denies via zero matched rows)'
);
select tests.authenticate_as('00000000-0000-0000-0000-0000000000a9'::uuid);
select is(
  (select metadata from storage.objects
   where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-0000000000a9/me.jpg'),
  null,
  'A9: user B''s UPDATE did not actually change user A''s object metadata'
);

-- A9: B cannot DELETE A's avatar object.
select tests.authenticate_as('00000000-0000-0000-0000-0000000000b9'::uuid);
select lives_ok(
  $$ delete from storage.objects
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-0000000000a9/me.jpg' $$,
  'A9: the DELETE statement itself does not error'
);
select tests.authenticate_as('00000000-0000-0000-0000-0000000000a9'::uuid);
select isnt_empty(
  $$ select 1 from storage.objects
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-0000000000a9/me.jpg' $$,
  'A9: the object still exists — user B''s DELETE did not actually remove it'
);

-- Positive: A can read and delete their own object.
select isnt_empty(
  $$ select 1 from storage.objects
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-0000000000a9/me.jpg' $$,
  'A9 sanity: user A can SELECT their own avatar object'
);
select lives_ok(
  $$ delete from storage.objects
     where bucket_id = 'avatars' and name = '00000000-0000-0000-0000-0000000000a9/me.jpg' $$,
  'A9 sanity: user A can DELETE their own avatar object'
);

select * from finish();
rollback;
