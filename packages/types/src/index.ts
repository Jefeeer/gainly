// @gainly/types — shared domain & API types. Row + enum types hand-authored from the frozen
// migration DDL (P1-TYPES); reconciled against `supabase gen types` after G-52 applies the migration.
// Extensionless relative exports are deliberate (bundler/vitest resolution; see @gainly/database).
export * from './enums';
export * from './tables';
