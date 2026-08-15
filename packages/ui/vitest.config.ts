import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Mirrors frontend/vitest.config.ts: JSX transform only, no path aliases needed
// since everything inside this package imports relatively.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    css: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
