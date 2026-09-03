-- ============================================================================
-- ROLLBACK for 20260902142100_initial_schema.sql  (G-24, Dwight)
--
-- MANUAL USE ONLY. Deliberately placed OUTSIDE supabase/migrations/ so the Supabase
-- CLI never scans/auto-runs it (every .sql under migrations/ is treated as a forward
-- migration; a drop-everything file there would be catastrophic).
--
-- Reverses the initial schema. `drop table ... cascade` removes each table's policies,
-- triggers, constraints, indexes, and FKs, so those need no separate drops.
-- Order: storage policies+buckets -> tables (reverse dependency) -> functions -> enums.
-- Extensions (pgcrypto, pg_trgm, unaccent) are intentionally NOT dropped — they are
-- cluster-shared and may be used elsewhere. Uncomment the tail if a full teardown is wanted.
-- ============================================================================

begin;

-- Storage policies + buckets (created in §15)
drop policy if exists avatars_sel          on storage.objects;
drop policy if exists avatars_ins          on storage.objects;
drop policy if exists avatars_upd          on storage.objects;
drop policy if exists avatars_del          on storage.objects;
drop policy if exists progress_photos_sel  on storage.objects;
drop policy if exists progress_photos_ins  on storage.objects;
drop policy if exists progress_photos_upd  on storage.objects;
drop policy if exists progress_photos_del  on storage.objects;
drop policy if exists exercise_media_sel   on storage.objects;
drop policy if exists exercise_media_ins   on storage.objects;
drop policy if exists exercise_media_upd   on storage.objects;
drop policy if exists exercise_media_del   on storage.objects;
delete from storage.buckets where id in ('avatars','exercise-media','progress-photos');

-- Application tables — reverse dependency order (cascade clears dependents)
drop table if exists admin_audit_logs      cascade;
drop table if exists analytics_events      cascade;
drop table if exists health_connections    cascade;
drop table if exists device_tokens         cascade;
drop table if exists notification_preferences cascade;
drop table if exists subscriptions         cascade;
drop table if exists daily_activity        cascade;
drop table if exists water_logs            cascade;
drop table if exists food_logs             cascade;
drop table if exists meals                 cascade;
drop table if exists foods                 cascade;
drop table if exists nutrition_goals       cascade;
drop table if exists weight_logs           cascade;
drop table if exists body_measurements     cascade;
drop table if exists personal_records      cascade;
drop table if exists workout_sets          cascade;
drop table if exists workout_session_exercises cascade;
drop table if exists workout_sessions      cascade;
drop table if exists program_workouts      cascade;
drop table if exists program_days          cascade;
drop table if exists program_weeks         cascade;
drop table if exists programs              cascade;
drop table if exists workout_template_exercises cascade;
drop table if exists workout_templates     cascade;
drop table if exists user_goals            cascade;
drop table if exists user_settings         cascade;
drop table if exists exercise_favorites    cascade;
drop table if exists exercise_aliases      cascade;
drop table if exists exercise_muscles      cascade;
drop table if exists exercises             cascade;
drop table if exists exercise_categories   cascade;
drop table if exists equipment             cascade;
drop table if exists muscles               cascade;
drop table if exists profiles              cascade;   -- is_admin() depends on this; dropped next anyway

-- Functions
drop function if exists enforce_wg_sync_scope()          cascade;
drop function if exists guard_foods_verified()           cascade;
drop function if exists guard_profiles_privileged_cols() cascade;
drop function if exists set_updated_at()                 cascade;
drop function if exists is_admin()                       cascade;

-- Enum types
drop type if exists program_status;
drop type if exists template_visibility;
drop type if exists health_provider;
drop type if exists subscription_provider;
drop type if exists subscription_status;
drop type if exists subscription_plan;
drop type if exists nutrition_goal_mode;
drop type if exists meal_type;
drop type if exists pr_type;
drop type if exists goal_status;
drop type if exists exercise_source;
drop type if exists difficulty_level;
drop type if exists set_type;
drop type if exists exercise_type;
drop type if exists biological_sex;
drop type if exists fitness_goal;
drop type if exists experience_level;
drop type if exists measurement_system;

commit;

-- Full teardown of shared extensions (only if this DB is dedicated to Gainly):
-- drop extension if exists unaccent;
-- drop extension if exists pg_trgm;
-- drop extension if exists pgcrypto;
