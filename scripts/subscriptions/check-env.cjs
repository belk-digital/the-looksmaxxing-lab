// Verifies that after Next.js loads .env/.env.local on top of the launcher env, no production value survives.
const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd(), true)
const prodish = []
const must = { DATABASE_URI: (v) => /@127\.0\.0\.1:/.test(v), RESEND_API_KEY: (v) => v === 're_local_fake',
  STRIPE_SECRET_KEY: (v) => v === 'sk_test_local_fake', CROSS_SITE_PAYMENT_SECRET: (v) => v.startsWith('local-'),
  LONGEVIA_BEAUTY_BRIDGE_URL: (v) => v.startsWith('http://127.0.0.1'), CRON_SECRET: (v) => v.startsWith('local-'),
  PAYLOAD_SECRET: (v) => v.startsWith('local-'), NEXTAUTH_SECRET: (v) => v.startsWith('local-'),
  R2_BUCKET: (v) => !v, R2_ENDPOINT: (v) => !v, R2_ACCESS_KEY_ID: (v) => !v, R2_SECRET_ACCESS_KEY: (v) => !v,
  GOOGLE_CLIENT_SECRET: (v) => v === 'local-fake', STRIPE_WEBHOOK_SECRET: (v) => v === 'whsec_local_fake' }
for (const [k, ok] of Object.entries(must)) if (!ok(process.env[k] || '')) prodish.push(k)
console.log(prodish.length ? 'UNSAFE - production value leaked through for: ' + prodish.join(', ') : 'SAFE: all sensitive variables are local/fake after Next env loading')
process.exit(prodish.length ? 1 : 0)
