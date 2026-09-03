// Estimated one-rep max. Semantics: docs/workout-semantics.md §2.
// Epley for reps > 1; reps === 1 short-circuits to the raw weight because a true single
// already IS the 1RM — Epley(w, 1) = w × 1.0333 would inflate a genuine max by ~3% and let a
// lighter multi-rep set outrank it. The short-circuit is explicit, not a coincidental match.
export function calculateE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}
