import { defineConfig, devices } from '@playwright/test';

// The parent starts the built site. Use Wrangler (4189) to verify real headers.
const baseURL = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4189';
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  outputDir: '../../.cache/playwright-results',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
});
