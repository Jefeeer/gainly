import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Shared Vitest config for React component tests (packages/ui, apps/web, apps/admin).
 *
 * @type {import("vitest/config").UserConfig}
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["@gainly/config/vitest/setup"],
    // See base.js: a test-less package (ui, admin, web today) must not redden the repo-wide
    // run. Only affects the empty case — a package with tests still fails on a real failure.
    passWithNoTests: true,
  },
});
