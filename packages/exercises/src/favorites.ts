/**
 * Exercise favorites — client-side, localStorage-backed.
 * §59: "Allow users to favor exercise. Favorites should appear prominently in exercise selection."
 *
 * In production, favorites are stored in the DB (exercise_favorites table with RLS).
 * This module provides the client-side interface that works with both localStorage
 * (offline/early) and the DB (once auth + DB are wired).
 */

const STORAGE_KEY = 'gainly_exercise_favorites';

/**
 * Get favorite exercise slugs from localStorage.
 * Returns an empty array if no favorites exist or localStorage is unavailable.
 */
export function getFavoriteSlugs(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save favorite exercise slugs to localStorage.
 */
export function saveFavoriteSlugs(slugs: string[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Silently fail — favorites are non-critical
  }
}

/**
 * Toggle an exercise slug in the favorites list.
 * Returns the updated list.
 */
export function toggleFavorite(slug: string): string[] {
  const current = getFavoriteSlugs();
  const idx = current.indexOf(slug);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(slug);
  }
  saveFavoriteSlugs(current);
  return current;
}

/**
 * Check if an exercise slug is favorited.
 */
export function isFavorite(slug: string): boolean {
  return getFavoriteSlugs().includes(slug);
}

/**
 * Add an exercise to favorites (no-op if already favorited).
 */
export function addFavorite(slug: string): string[] {
  const current = getFavoriteSlugs();
  if (!current.includes(slug)) {
    current.push(slug);
    saveFavoriteSlugs(current);
  }
  return current;
}

/**
 * Remove an exercise from favorites (no-op if not favorited).
 */
export function removeFavorite(slug: string): string[] {
  const current = getFavoriteSlugs();
  const idx = current.indexOf(slug);
  if (idx >= 0) {
    current.splice(idx, 1);
    saveFavoriteSlugs(current);
  }
  return current;
}
