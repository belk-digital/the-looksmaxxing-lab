/**
 * A stand-in for the longeviabeauty.com WordPress bridge plugin, for LOCAL end-to-end tests only.
 * It implements the same checks as wordpress-bridge/longevia-payment-bridge.php:
 *   - verifies HMAC-SHA256(secret, payload) (hash_equals)
 *   - requires the same fields, rejects hand-offs older than 10 minutes, rejects a reused nonce, requires USD
 * and, when the "customer pays", sends the same signed confirmation webhook back to the app,
 * then redirects the customer to the returnUrl.
 *
 * Test controls:  POST /__config {"webhookDelayMs": 8000}   delays the confirmation webhook (to see "Confirming...")
 *                 GET  /__state                            what it has received/paid
 */
const http = require('http')
const crypto = require('crypto')

const PORT = Number(process.env.LM_WP_PORT || 54400)
const APP = `http://localhost:${process.env.LM_APP_PORT || 3100}`
const SECRET = process.env.CROSS_SITE_PAYMENT_SECRET || 'local-bridge-secret-0123456789abcdef0123'
const MAX_AGE_SECONDS = 600

const orders = new Map() // wooCommerce order id -> { ...decoded, paid }
const usedNonces = new Set()
const config = { webhookDelayMs: 0 }
let nextId = 5000

const hmac = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex')
const readBody = (req) => new Promise((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b)) })
const send = (res, status, body, type = 'text/html') => { res.writeHead(status, { 'content-type': type }); res.end(body) }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

async function sendConfirmation(o) {
  const body = JSON.stringify({ orderId: o.orderId, amountCents: o.amountCents, status: 'succeeded', txnId: o.txnId, affiliateId: o.affiliateId || null, clickId: o.clickId || null })
  const res = await fetch(`${APP}/api/webhooks/cross-site-payment`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-longevia-signature': hmac(body) }, body })
  o.webhookStatus = res.status
  console.log(`[fake-wp] confirmation for order ${o.orderId} -> ${res.status}`)
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  try {
    if (url.pathname === '/__health') return send(res, 200, 'ok', 'text/plain')
    if (url.pathname === '/__state') return send(res, 200, JSON.stringify({ orders: [...orders.entries()], config }), 'application/json')
    if (url.pathname === '/__config' && req.method === 'POST') {
      Object.assign(config, JSON.parse((await readBody(req)) || '{}'))
      return send(res, 200, JSON.stringify(config), 'application/json')
    }

    // ---- the hand-off from longeviaresearch.com ----------------------------------------------------------
    if (url.pathname === '/wp-json/longevia-bridge/v1/pay' && req.method === 'POST') {
      const form = new URLSearchParams(await readBody(req))
      const payload = form.get('payload')
      const sig = form.get('sig')
      const fail = (code, message) => send(res, 400, JSON.stringify({ code, message, data: { status: 400 } }), 'application/json')
      if (!payload || !sig) return fail('longevia_bridge_bad_request', 'Missing payload or signature.')
      const expected = hmac(payload)
      if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return fail('longevia_bridge_invalid_signature', 'Invalid signature.')
      let d
      try { d = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) } catch { return fail('longevia_bridge_bad_payload', 'Malformed payload.') }
      for (const k of ['orderId', 'orderNumber', 'amountCents', 'currency', 'returnUrl', 'cancelUrl', 'nonce', 'ts']) {
        if (d[k] === undefined || d[k] === null || d[k] === '') return fail('longevia_bridge_bad_payload', `Missing field: ${k}`)
      }
      if (Math.abs(Date.now() / 1000 - Number(d.ts) / 1000) > MAX_AGE_SECONDS) return fail('longevia_bridge_expired', 'This payment link has expired. Please return to checkout and try again.')
      if (usedNonces.has(d.nonce)) return fail('longevia_bridge_replay', 'This payment link has already been used.')
      usedNonces.add(d.nonce)
      if (String(d.currency).toUpperCase() !== 'USD') return fail('longevia_bridge_currency_mismatch', 'Currency mismatch between sites.')
      if (!(Number(d.amountCents) > 0)) return fail('longevia_bridge_bad_amount', 'Invalid amount.')

      const wcId = nextId++
      orders.set(wcId, { ...d, orderId: String(d.orderId), amountCents: Number(d.amountCents), txnId: `FAKE-${wcId}`, paid: false })
      return send(
        res,
        200,
        `<!doctype html><html><body style="font-family:sans-serif;max-width:480px;margin:60px auto" data-testid="fake-wordpress">
          <h1>Longevia Beauty - secure payment (TEST)</h1>
          <p data-testid="wp-order">Order <strong>Longevia Research Order #${esc(d.orderNumber)}</strong></p>
          <p data-testid="wp-amount">Amount: <strong>$${(Number(d.amountCents) / 100).toFixed(2)}</strong></p>
          <p>${esc(d.firstName)} ${esc(d.lastName)} &lt;${esc(d.email)}&gt;</p>
          <form method="POST" action="/pay-complete?wc=${wcId}"><button id="pay" type="submit" style="padding:12px 24px">Pay with test card</button></form>
          <p><a id="cancel" href="${esc(d.cancelUrl)}">Cancel and return</a></p>
        </body></html>`,
      )
    }

    // ---- the customer completes the card payment ---------------------------------------------------------
    if (url.pathname === '/pay-complete' && req.method === 'POST') {
      const o = orders.get(Number(url.searchParams.get('wc')))
      if (!o) return send(res, 404, 'unknown order', 'text/plain')
      o.paid = true
      const fire = () => sendConfirmation(o).catch((e) => console.error('[fake-wp] webhook failed', e.message))
      if (config.webhookDelayMs > 0) setTimeout(fire, config.webhookDelayMs)
      else await fire()
      res.writeHead(302, { location: o.returnUrl })
      return res.end()
    }

    send(res, 404, 'not found', 'text/plain')
  } catch (e) {
    console.error('[fake-wp] error', e)
    send(res, 500, 'error', 'text/plain')
  }
}).listen(PORT, '127.0.0.1', () => console.log(`[fake-wp] listening on 127.0.0.1:${PORT}, app at ${APP}`))
