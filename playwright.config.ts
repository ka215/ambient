import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/scenarios',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://dev-amp.ka2.org/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Must be >= minFullUIWidth (1282) to prevent ambient.js from auto-closing drawers on item click
    viewport: { width: 1400, height: 800 },
  },
  reporter: [['list']],
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 800 } },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1400, height: 800 } },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1400, height: 800 } },
    },
    {
      name: 'ipad',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'android',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
