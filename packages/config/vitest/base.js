import { defineConfig } from "vitest/config";

/**
 * Shared Vitest config for pure-logic packages (no DOM).
 *
 * @type {import("vitest/config").UserConfig}
 */
export default defineConfig({
  test: {
    environment: "node",
    // A package with zero test files is not a failure — several packages (types, validation,
    // constants, ...) are legitimately test-less right now. Without this, vitest exits 1 on
    // "No test files found" and reddens `turbo run test` repo-wide. This only affects the
    // empty case: a package WITH tests still fails on any failing assertion.
    passWithNoTests: true,
  },
});
