import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { loadAccounts } from './fixtures/auth';

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  // Each worker needs its own account, because the test changes account preferences.
  workers: Math.max(1, loadAccounts().length),
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ['list', { printSteps: true }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.WIKI_BASE_URL || 'https://en.wikipedia.org',
    locale: 'en-US',
    actionTimeout: 15 * 1000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

