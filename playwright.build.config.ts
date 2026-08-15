import { defineConfig, devices } from "@playwright/test";

/**
 * Production-build E2E config — "eject / debug the build".
 *
 * This config runs the E2E suite against the *built* app served by `vite
 * preview`, so you can debug issues that only appear in production output.
 *
 * Usage:
 *   npm run build && npm run test:e2e:build        # run against built app
 *   npm run test:e2e:build:debug                    # headed + inspector
 *
 * The production app is served under /groove-composer/ (see vite.config.ts
 * `base`), hence the baseURL below.
 */
const BASE_URL = "http://localhost:4173/groove-composer/";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /build\.spec\.ts/,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
