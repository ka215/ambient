import { defineConfig, devices } from '@playwright/test';

const viewport = { width: 1400, height: 900 };
const slowMo = Number.parseInt(process.env.AMP_DEMO_SLOW_MO_MS || '100', 10);
const headless = process.env.AMP_DEMO_HEADLESS === '1';

export default defineConfig({
  testDir: './tests/demo',
  timeout: 240_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  outputDir: './artifacts/demo/videos',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:8091/',
    headless,
    launchOptions: {
      slowMo: Number.isFinite(slowMo) ? slowMo : 100,
      args: [
        '--enable-gpu',
        '--enable-accelerated-2d-canvas',
        '--enable-zero-copy',
        '--ignore-gpu-blocklist',
      ],
    },
    viewport,
    video: {
      mode: 'on',
      size: viewport,
    },
    trace: 'off',
    screenshot: 'off',
  },
  reporter: [['list']],
  projects: [
    {
      name: 'demo-chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless,
        launchOptions: {
          slowMo: Number.isFinite(slowMo) ? slowMo : 100,
          args: [
            '--enable-gpu',
            '--enable-accelerated-2d-canvas',
            '--enable-zero-copy',
            '--ignore-gpu-blocklist',
          ],
        },
        viewport,
      },
    },
  ],
});
