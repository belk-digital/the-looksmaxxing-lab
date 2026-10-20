/**
 * Preloaded (via NODE_OPTIONS --require) ONLY by scripts/subscriptions/local-env.cjs.
 * Intercepts calls to the Resend REST API and appends them to a JSONL file instead of sending,
 * so local testing can never email a real customer, and tests can read the emails.
 */
const fs = require('fs')
const path = require('path')

const file = process.env.LM_EMAIL_CAPTURE_FILE
if (file) {
  const realFetch = globalThis.fetch
  globalThis.fetch = async function patchedFetch(input, init) {
    const url = typeof input === 'string' ? input : input && input.url ? input.url : String(input)
    if (url.startsWith('https://api.resend.com/emails')) {
      try {
        fs.mkdirSync(path.dirname(file), { recursive: true })
        const body = init && init.body ? JSON.parse(init.body) : {}
        fs.appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), ...body }) + '\n')
      } catch {
        // never break the app because of capture problems
      }
      return new Response(JSON.stringify({ id: 'local-captured-email' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    return realFetch(input, init)
  }
}
