import crypto from 'crypto'

// ShipStation's V1 webhooks carry no signature, so the webhook URL we register contains a secret token that only
// we and ShipStation know. It is derived from SHIPSTATION_API_SECRET: that value must already be identical
// everywhere the integration runs (local, Vercel), so the token registered from one place verifies in the other
// with no extra environment variable to keep in sync. (Rotating the ShipStation API secret therefore requires
// registering the webhook again, see scripts/shipstation-register-webhook.ts.)
export function shipstationWebhookToken(secret: string): string {
  return crypto.createHmac('sha256', secret).update('shipstation-webhook').digest('hex')
}

export function verifyShipstationWebhookToken(token: string | null | undefined, secret: string): boolean {
  if (!token || !secret) return false
  const expected = Buffer.from(shipstationWebhookToken(secret))
  const given = Buffer.from(token)
  return expected.length === given.length && crypto.timingSafeEqual(expected, given)
}
