import { defineConfig, devices } from "@playwright/test";

const port = 3100;

// End-to-end tests run against a production build that includes the harness
// pages (KATAI_E2E=1) and talks to the Firebase emulators, in the three browser engines.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${port}` },
  // Pages render per request (CSP nonce) and talk to the emulators: under a full parallel
  // run, a step can take longer than the default 5 seconds.
  expect: { timeout: 10_000 },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: 'firebase emulators:exec --only auth,firestore --project demo-katai "npm run build:e2e && npm run start:e2e"',
    url: `http://localhost:${port}/e2e-sandbox`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // SIGINT lets the Firebase CLI stop its emulators; the default SIGKILL leaves them running.
    gracefulShutdown: { signal: "SIGINT", timeout: 15_000 },
  },
});
