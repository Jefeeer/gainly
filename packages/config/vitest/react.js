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
  },
});
