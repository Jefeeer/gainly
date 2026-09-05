// @gainly/exercises — Gainly's exercise layer.
// The workout-guide provider is the single isolation seam over @bryllim/workout-guide.
// Everything else in Gainly depends on this provider, never on the package.
//
// Modules:
// - workout-guide: in-memory catalog (normalize/search/filter over 302 exercises)
// - mapper: WG → Gainly taxonomy normalization
// - aliases: client-side alias lookup for search enhancement
// - favorites: localStorage-backed exercise favorites

export * from './workout-guide';
export * from './mapper';
export * from './aliases';
export * from './favorites';
