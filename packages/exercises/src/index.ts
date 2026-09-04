// @gainly/exercises — Gainly's exercise layer. The workout-guide provider is the single isolation
// seam over @bryllim/workout-guide (in-memory catalog: normalize/search/filter over 302 exercises).
// Extensionless re-export is deliberate (bundler/vitest resolution; see @gainly/database).
export * from './workout-guide';
