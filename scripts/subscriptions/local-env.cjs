/**
 * Local, fully-isolated environment for developing/testing subscriptions.
 *
 * Every production credential name found in .env / .env.local is replaced with a harmless local value,
 * the database is forced to the throwaway local Postgres, and the process REFUSES to start if the
 * resulting database is not local. Outgoing email is captured to a file instead of being sent.
 *
 * Usage:  node scripts/subscriptions/local-env.cjs <command> [args...]
 *         (e.g. node scripts/subscriptions/local-env.cjs npx tsx scripts/subscriptions/push-schema.ts)
 */
const path = require('path')
const { spawn } = require('child_process')

// The project path contains spaces, so the preload path is quoted and uses forward slashes.
const CAPTURE_PRELOAD = path.join(__dirname, 'email-capture.cjs').split(path.sep).join('/')

const DB = process.env.LM_DB || 'lm_work'
const PG_PORT = process.env.LM_PG_PORT || '54329'
const APP_PORT = process.env.LM_APP_PORT || '3100'
const WP_PORT = process.env.LM_WP_PORT || '54400'

function localEnv() {
  const root = path.resolve(__dirname, '..', '..')
  return {
    ...process.env,
    // --- database: the ONLY thing that matters most ---
    DATABASE_URI: `postgres://postgres:postgres@127.0.0.1:${PG_PORT}/${DB}`,
    DATABASE_URL: '',
    PAYLOAD_DB_PUSH: process.env.PAYLOAD_DB_PUSH || 'false',
    NODE_ENV: process.env.NODE_ENV || 'development',
    // --- app ---
    PAYLOAD_SECRET: 'local-test-payload-secret-0123456789abcdef',
    PAYLOAD_PUBLIC_SERVER_URL: `http://localhost:${APP_PORT}`,
    NEXT_PUBLIC_SERVER_URL: `http://localhost:${APP_PORT}`,
    LM_DIST_DIR: '.next-test', // own build folder: never collides with a running `pnpm dev`
    NEXTAUTH_URL: `http://localhost:${APP_PORT}`,
    NEXTAUTH_SECRET: 'local-test-nextauth-secret-0123456789abcdef',
    PORT: APP_PORT,
    // --- payments / bridge (fake WordPress runs on WP_PORT) ---
    CROSS_SITE_PAYMENT_SECRET: 'local-bridge-secret-0123456789abcdef0123',
    LONGEVIA_BEAUTY_BRIDGE_URL: `http://127.0.0.1:${WP_PORT}/wp-json/longevia-bridge/v1/pay`,
    STRIPE_SECRET_KEY: 'sk_test_local_fake',
    STRIPE_WEBHOOK_SECRET: 'whsec_local_fake',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_local_fake',
    CRON_SECRET: 'local-cron-secret-0123456789abcdef',
    // --- third parties: neutralised (emails are captured, see email-capture.cjs) ---
    RESEND_API_KEY: 're_local_fake',
    RESEND_AUDIENCE_ID: 'local',
    RESEND_FROM_EMAIL: 'orders@local.test',
    GOOGLE_CLIENT_ID: 'local-fake',
    GOOGLE_CLIENT_SECRET: 'local-fake',
    R2_ENDPOINT: '',
    R2_ACCESS_KEY_ID: '',
    R2_SECRET_ACCESS_KEY: '',
    R2_BUCKET: process.env.LM_R2_BUCKET || '',
    R2_PUBLIC_URL: '',
    GOOGLE_SHEETS_CLIENT_EMAIL: '',
    GOOGLE_SHEETS_PRIVATE_KEY: '',
    GOOGLE_SHEETS_ORDER_SPREADSHEET_ID: '',
    LM_EMAIL_CAPTURE_FILE: path.join(root, '.local-test', 'emails.jsonl'),
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --no-deprecation --max-old-space-size=4096 --require "${CAPTURE_PRELOAD}"`.trim(),
  }
}

function assertLocal(env) {
  const u = new URL(env.DATABASE_URI)
  if (!['127.0.0.1', 'localhost'].includes(u.hostname)) {
    throw new Error(`REFUSING TO RUN: database host is "${u.hostname}", not local.`)
  }
}

module.exports = { localEnv, assertLocal, DB, PG_PORT, APP_PORT, WP_PORT }

if (require.main === module) {
  const [cmd, ...args] = process.argv.slice(2)
  if (!cmd) {
    console.error('usage: node scripts/subscriptions/local-env.cjs <command> [args...]')
    process.exit(2)
  }
  const env = localEnv()
  assertLocal(env)
  const child = spawn(cmd, args, { stdio: 'inherit', env, shell: true, cwd: path.resolve(__dirname, '..', '..') })
  child.on('exit', (code) => process.exit(code ?? 1))
}
