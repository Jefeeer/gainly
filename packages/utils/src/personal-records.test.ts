// G-38 (Angela): first real unit tests for the two settled PR semantics in
// docs/workout-semantics.md §1.1 (strictly-greater tie handling) and §1.2 (max_reps scoped per
// weight bucket). Intentionally RED right now, same two reasons as ./e1rm.test.ts:
//   1. `vitest` is not yet a dependency of this package (Darryl, G-37).
//   2. `./personal-records` does not exist yet — this file specifies its intended signature.
//
// Assumed signatures:
//   isNewPersonalRecord(candidateValue: number, currentBest: number | null): boolean
//     currentBest === null means no prior baseline for this key -> always a PR.
//   detectMaxRepsPR(history: { weight: number | null; reps: number }[],
//                   candidate: { weight: number | null; reps: number }): boolean
//     Scopes the comparison to entries in `history` sharing candidate.weight (bodyweight is the
//     weight === null bucket) before applying isNewPersonalRecord — this is what makes
//     "highest reps" mean "at that weight," not "at any weight."
import { describe, expect, it } from 'vitest';
import { detectMaxRepsPR, isNewPersonalRecord } from './personal-records.js';

describe('isNewPersonalRecord (docs/workout-semantics.md §1.1 — strictly greater, never equal)', () => {
  it('flags a PR when the candidate strictly exceeds the current best', () => {
    expect(isNewPersonalRecord(105, 100)).toBe(true);
  });

  it('does NOT flag a PR when the candidate merely equals the current best', () => {
    // The exact regression this test exists for: matching your best is not a record. Without
    // strict `>`, a user repeating the same performance every week would get "New PR!" every
    // session, which is celebration noise that erodes trust in the feature.
    expect(isNewPersonalRecord(100, 100)).toBe(false);
  });

  it('does NOT flag a PR when the candidate is below the current best', () => {
    expect(isNewPersonalRecord(90, 100)).toBe(false);
  });

  it('flags a PR on the first-ever set for a key (no prior baseline)', () => {
    // The classic null-baseline bug: there is nothing to exceed yet, so this is the one case a
    // non-exceeding-looking value is still correctly a PR. Must not throw on a null baseline.
    expect(isNewPersonalRecord(50, null)).toBe(true);
  });
});

describe('detectMaxRepsPR (docs/workout-semantics.md §1.2 — scoped per (exercise, weight))', () => {
  it('flags a PR for more reps at a weight bucket with no prior history at that weight', () => {
    expect(detectMaxRepsPR([], { weight: 100, reps: 8 })).toBe(true);
  });

  it('flags a PR for more reps than the current best AT THE SAME weight', () => {
    const history = [{ weight: 100, reps: 6 }];
    expect(detectMaxRepsPR(history, { weight: 100, reps: 8 })).toBe(true);
  });

  it('does NOT flag a PR for fewer reps at the same weight', () => {
    const history = [{ weight: 100, reps: 8 }];
    expect(detectMaxRepsPR(history, { weight: 100, reps: 6 })).toBe(false);
  });

  it('a lighter-weight rep max NEVER outranks a heavier weight bucket (the any-weight bug)', () => {
    // The exact regression this test exists for: 30 reps @ 20kg must not register as beating,
    // or even being compared against, 5 reps @ 100kg. They are different keys entirely.
    const history = [{ weight: 100, reps: 5 }];
    expect(detectMaxRepsPR(history, { weight: 20, reps: 30 })).toBe(true); // new PR for the 20kg bucket...
    expect(detectMaxRepsPR(history, { weight: 100, reps: 5 })).toBe(false); // ...but the 100kg record is untouched
  });

  it('bodyweight (weight IS NULL) is its own bucket, independent of any loaded weight', () => {
    const history = [{ weight: 100, reps: 5 }];
    expect(detectMaxRepsPR(history, { weight: null, reps: 12 })).toBe(true);
  });
});
