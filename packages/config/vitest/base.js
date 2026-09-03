import { defineConfig } from "vitest/config";

/**
 * Shared Vitest config for pure-logic packages (no DOM).
 *
 * @type {import("vitest/config").UserConfig}
 */
export default defineConfig({
  test: {
    environment: "node",
  },
});
