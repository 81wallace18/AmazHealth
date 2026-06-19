import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: process.env.E2E_VIDEO_OUTPUT_DIR || 'test-results/video',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 5 * 60 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_FRONTEND_URL || 'http://localhost:5173',
    trace: 'off',
    screenshot: 'on',
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 },
    },
    launchOptions: {
      slowMo: Number(process.env.E2E_VIDEO_SLOW_MO_MS || 250),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
