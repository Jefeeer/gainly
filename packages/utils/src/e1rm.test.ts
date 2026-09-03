// G-38 (Angela): first real unit test for the settled e1RM semantics in
// docs/workout-semantics.md §2. Intentionally RED right now for two independent reasons, both
// expected until other cards land:
//   1. `vitest` is not yet a dependency of this package (Darryl, G-37).
//   2. `./e1rm` does not exist yet — this file specifies its intended signature; whoever
//      implements it should make these assertions pass, not redesign the test to match a
//      different shape without checking back with Angela/Dwight.
//
// Assumed signature: `calculateE1RM(weight: number, reps: number): number`.
import { describe, expect, it } from 'vitest';
import { calculateE1RM } from './e1rm';

describe('calculateE1RM (docs/workout-semantics.md §2)', () => {
  it('applies the Epley formula for reps > 1 (100kg x 5 -> 116.67)', () => {
    expect(calculateE1RM(100, 5)).toBeCloseTo(116.67, 2);
  });

  it('reps=1 returns the raw weight, NOT Epley (100kg x 1 -> 100.00, not 103.33)', () => {
    // The single most important regression to catch here: a true single IS the 1RM by
    // definition. Epley(100, 1) = 100 * (1 + 1/30) = 103.33 and would overstate a genuine
    // max by ~3%, letting a lighter multi-rep set outrank it. This must be an explicit
    // short-circuit before the formula runs, not a coincidental match.
    expect(calculateE1RM(100, 1)).toBeCloseTo(100.0, 2);
  });

  it('reps=1 short-circuits regardless of weight (60kg x 1 -> 60.00)', () => {
    expect(calculateE1RM(60, 1)).toBeCloseTo(60.0, 2);
  });

  it('higher reps produce a higher estimate for the same weight (monotonic in reps)', () => {
    const at5 = calculateE1RM(100, 5);
    const at10 = calculateE1RM(100, 10);
    expect(at10).toBeGreaterThan(at5);
  });
});
