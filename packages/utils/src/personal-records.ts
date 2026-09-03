// Personal-record detection. Semantics: docs/workout-semantics.md §1.1 / §1.2.

// Strictly greater, never equal: matching your best is not a record (keeps re-detection
// idempotent). A null baseline means no prior best for this key, so the first set always qualifies.
export function isNewPersonalRecord(candidateValue: number, currentBest: number | null): boolean {
  if (currentBest === null) return true;
  return candidateValue > currentBest;
}

// Max-reps PR scoped per (exercise, weight): only history entries at the SAME weight bucket compete,
// so a lighter-weight rep max never outranks a heavier one. Bodyweight is the weight === null bucket.
export function detectMaxRepsPR(
  history: { weight: number | null; reps: number }[],
  candidate: { weight: number | null; reps: number },
): boolean {
  const atSameWeight = history.filter((entry) => entry.weight === candidate.weight);
  const bestReps = atSameWeight.length > 0 ? Math.max(...atSameWeight.map((entry) => entry.reps)) : null;
  return isNewPersonalRecord(candidate.reps, bestReps);
}
