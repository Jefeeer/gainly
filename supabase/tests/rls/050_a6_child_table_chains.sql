-- A6 (Oscar G-17). rls.md §2: child tables with no user_id authorize via an `exists` join up to
-- the ultimate owner, and A6's fix spells out BOTH `using` and `with check` on every `for all`
-- policy in the chain — "same pattern as the last one" is exactly how an implementer drops
-- `with check` and reopens a re-parent hole. This file walks the two chains god named: the
-- 2-hop workout_template_exercises -> workout_templates chain, and the full 4-table
-- program_workouts -> program_days -> program_weeks -> programs chain. Cross-user access must be
-- denied at EVERY hop, for both read and write.
begin;
select plan(10);

select tests.create_user('00000000-0000-0000-0000-0000000000a6'::uuid, 'a6-user-a@test.gainly');
select tests.create_user('00000000-0000-0000-0000-0000000000b6'::uuid, 'a6-user-b@test.gainly');

-- ---- Chain 1: workout_template_exercises -> workout_templates ----
select tests.authenticate_as('00000000-0000-0000-0000-0000000000a6'::uuid);
select lives_ok(
  $$ insert into workout_templates (id, user_id, name)
     values ('00000000-0000-0000-0000-00000000ad06', '00000000-0000-0000-0000-0000000000a6', 'A''s Template') $$,
  'A6 setup: user A creates their own template'
);
select lives_ok(
  $$ insert into exercises (id, name, slug, exercise_type, source)
     values ('00000000-0000-0000-0000-00000000ae08', 'Shared Lift', 'shared-lift-a6', 'weight_reps', 'gainly') $$,
  'A6 setup: seed a global exercise to attach to the template'
);
select lives_ok(
  $$ insert into workout_template_exercises (template_id, exercise_id, position)
     values ('00000000-0000-0000-0000-00000000ad06', '00000000-0000-0000-0000-00000000ae08', 1) $$,
  'A6 setup: user A adds an exercise to their own template'
);

select tests.authenticate_as('00000000-0000-0000-0000-0000000000b6'::uuid);
select is_empty(
  $$ select 1 from workout_template_exercises where template_id = '00000000-0000-0000-0000-00000000ad06' $$,
  'A6: user B cannot SELECT user A''s template_exercises row (1-hop join)'
);
select throws_ok(
  $$ insert into workout_template_exercises (template_id, exercise_id, position)
     values ('00000000-0000-0000-0000-00000000ad06', '00000000-0000-0000-0000-00000000ae08', 2) $$,
  'A6: user B cannot INSERT a row against user A''s template_id — WITH CHECK on the join denies it'
);

-- ---- Chain 2: program_workouts -> program_days -> program_weeks -> programs ----
select tests.authenticate_as('00000000-0000-0000-0000-0000000000a6'::uuid);
select lives_ok(
  $$ insert into programs (id, user_id, name) values
     ('00000000-0000-0000-0000-00000000af06', '00000000-0000-0000-0000-0000000000a6', 'A''s Program') $$,
  'A6 setup: user A creates their own program'
);
select lives_ok(
  $$ insert into program_weeks (id, program_id, week_number) values
     ('00000000-0000-0000-0000-00000000a106', '00000000-0000-0000-0000-00000000af06', 1) $$,
  'A6 setup: user A adds week 1'
);
select lives_ok(
  $$ insert into program_days (id, program_week_id, day_of_week) values
     ('00000000-0000-0000-0000-00000000a206', '00000000-0000-0000-0000-00000000a106', 1) $$,
  'A6 setup: user A adds Monday to week 1'
);

select tests.authenticate_as('00000000-0000-0000-0000-0000000000b6'::uuid);
select is_empty(
  $$ select 1 from program_days where id = '00000000-0000-0000-0000-00000000a206' $$,
  'A6: user B cannot SELECT user A''s program_days row (2-hop join: days -> weeks -> programs)'
);
select throws_ok(
  $$ insert into program_workouts (program_day_id, template_id, position)
     values ('00000000-0000-0000-0000-00000000a206', '00000000-0000-0000-0000-00000000ad06', 1) $$,
  'A6: user B cannot INSERT a program_workouts row against user A''s program_day_id (3-hop join denies)'
);

select * from finish();
rollback;
