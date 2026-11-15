import { defineConfig, devices } from '@playwright/test';
import { env } from './config/environment';

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',

  // Timeouts
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Parallel execution + CI behaviour
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  // Reporting: HTML report (never auto-opens) + console list
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL: env.baseUrl,
    testIdAttribute: 'data-test', // Toolshop uses data-test="..." instead of data-testid
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry', // use `npm run test:trace` to force traces locally
  },

  projects: [
    // UI tests in three browsers
    { name: 'chromium', testIgnore: /api\//, use: { ...devices['Desktop Chrome'] } },
   // { name: 'firefox', testIgnore: /api\//, use: { ...devices['Desktop Firefox'] } },
   // { name: 'webkit', testIgnore: /api\//, use: { ...devices['Desktop Safari'] } },
    // API tests run once, without a browser
    { name: 'api', testMatch: /api\/.*\.spec\.ts/ },
  ],
});
