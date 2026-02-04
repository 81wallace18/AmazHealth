import { defineConfig, devices } from '@playwright/test';

// Playwright E2E para o fluxo MVP (UI).
// Pré-requisito: backend rodando em http://localhost:8080 e frontend em http://localhost:5173
// (ou sobrescreva via E2E_BACKEND_URL / E2E_FRONTEND_URL).

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 2 * 60 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_FRONTEND_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

