import { defineConfig, devices } from "@playwright/test";

const port = 3100;

// End-to-end tests run against a production build that includes the harness
// pages (KATAI_E2E=1), in the three browser engines.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm run build:e2e && npm run start:e2e",
    url: `http://localhost:${port}/e2e-sandbox`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
