import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Integration tests that run the REAL app code against a REAL (throwaway, local) PostgreSQL database.
 * Each test file gets its own freshly-copied database. Run through the isolated launcher:
 *   node scripts/subscriptions/local-env.cjs npx vitest run --config ./vitest.db.config.mts
 * They refuse to run unless the database host is local.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/db/**/*.db.spec.ts'],
    pool: 'forks',
    testTimeout: 120_000,
    hookTimeout: 240_000,
    maxWorkers: 2,
  },
})
