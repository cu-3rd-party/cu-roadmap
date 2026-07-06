import { defineConfig, devices } from "@playwright/test";

// e2e tests run against the full Docker compose stack (nginx -> Go backend ->
// Postgres), reached through nginx on port 9679 — the real production topology.
// See docker-compose.e2e.yml (parent repo root) for the deterministic overrides
// (Google Sheets sync disabled + cohort-tagged majors fixture mounted).
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:9679";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    // The built app registers a PWA service worker (vite-plugin-pwa autoUpdate).
    // Block it so cached responses can't make assertions flaky.
    serviceWorkers: "block",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "docker compose -f ../docker-compose.yml -f ../docker-compose.e2e.yml up --build",
    // ping test url
    url: `${BASE_URL}/api/v1/majors/`,
    reuseExistingServer: true,
    timeout: 600_000,
  },
});
