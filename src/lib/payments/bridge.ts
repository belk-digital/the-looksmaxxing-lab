import crypto from 'crypto'

/**
 * Builds the signed hand-off to the Authorize.net bridge on longeviabeauty.com (WordPress).
 * Used by the normal checkout and by the subscription pay link, so both stay identical.
 *
 * The WordPress plugin verifies HMAC-SHA256(secret, <the base64url payload string>) and rejects hand-offs
 * older than 10 minutes, so this must be called at the moment the customer clicks "Pay" - never in advance.
 */
export interface BridgeHandoffInput {
  orderId: string | number
  orderNumber: string | number | null | undefined
  amountCents: number
  email: string
  firstName: string
  lastName: string
  returnUrl: string
  cancelUrl: string
  /** Echoed back unchanged by the bridge so affiliate attribution survives the round trip. */
  affiliateId?: string | null
  clickId?: string | null
}

export interface BridgeHandoff {
  redirectUrl: string
  fields: { payload: string; sig: string }
}

export function bridgeIsConfigured(): boolean {
  return !!process.env.LONGEVIA_BEAUTY_BRIDGE_URL && !!process.env.CROSS_SITE_PAYMENT_SECRET
}

export function buildBridgeHandoff(input: BridgeHandoffInput): BridgeHandoff {
  const bridgeUrl = process.env.LONGEVIA_BEAUTY_BRIDGE_URL
  const secret = process.env.CROSS_SITE_PAYMENT_SECRET
  if (!bridgeUrl) throw new Error('Cross-site payment is not configured')
  if (!secret) throw new Error('CROSS_SITE_PAYMENT_SECRET is not configured')

  const body = {
    orderId: String(input.orderId),
    orderNumber: input.orderNumber,
    amountCents: input.amountCents,
    currency: 'usd',
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    affiliateId: input.affiliateId ?? null,
    clickId: input.clickId ?? null,
    nonce: crypto.randomBytes(16).toString('hex'),
    ts: Date.now(),
  }

  // Sign one opaque, base64url-encoded blob rather than the object itself: WordPress receives separate
  // POST fields, and re-serialising them there would not reliably reproduce the exact bytes hashed here.
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  return { redirectUrl: bridgeUrl, fields: { payload, sig } }
}
