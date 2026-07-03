import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Dedicated Vitest config — kept separate from vite.config.ts so the test
// runner doesn't pull in PWA/SSL/lingui dev concerns. Only the plugins the
// tests actually need (JSX transform + `@/*` path resolution) are loaded here.
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    css: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
