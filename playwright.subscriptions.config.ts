import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end browser tests for subscriptions, against a THROWAWAY local database and a fake WordPress bridge.
 * This config intentionally does NOT load .env and never touches the real database.
 *
 * Prepare:  create the database + seed it (see scripts/subscriptions/README.md), then
 *   LM_DB=lm_e2e npx playwright test --config playwright.subscriptions.config.ts
 * (the web server and the fake WordPress are started for you, through the isolated launcher)
 */
const APP_PORT = process.env.LM_APP_PORT || '3100'
const WP_PORT = process.env.LM_WP_PORT || '54400'
const DB = process.env.LM_DB || 'lm_e2e'

export default defineConfig({
  testDir: './tests/e2e-subscriptions',
  outputDir: './.local-test/e2e-results',
  timeout: 240_000,
  expect: { timeout: 30_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    screenshot: 'only-on-failure',
    trace: 'off',
    actionTimeout: 30_000,
    navigationTimeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } }],
  webServer: [
    {
      command: 'node scripts/subscriptions/fake-wordpress.cjs',
      url: `http://127.0.0.1:${WP_PORT}/__health`,
      reuseExistingServer: false,
      env: { LM_DB: DB, LM_APP_PORT: APP_PORT, LM_WP_PORT: WP_PORT, CROSS_SITE_PAYMENT_SECRET: 'local-bridge-secret-0123456789abcdef0123' },
    },
    {
      command: `node scripts/subscriptions/local-env.cjs npx next dev -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/api/notifications`,
      // LM_REUSE_SERVER=1 reuses an already-running local test site (faster while developing the tests)
      reuseExistingServer: process.env.LM_REUSE_SERVER === '1',
      timeout: 300_000,
      env: { LM_DB: DB, LM_APP_PORT: APP_PORT, LM_WP_PORT: WP_PORT },
    },
  ],
})
