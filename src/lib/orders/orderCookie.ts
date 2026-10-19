import crypto from 'crypto'

function getSecret(): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) {
    throw new Error('PAYLOAD_SECRET is not configured')
  }
  return secret
}

/** HMAC used to prove a browser placed the order it is asking to view. */
export function signOrderCookie(orderId: string): string {
  return crypto.createHmac('sha256', getSecret()).update(`order_${orderId}`).digest('hex')
}

export function verifyOrderCookie(orderId: string, value: string | undefined | null): boolean {
  if (!value) return false
  const expected = Buffer.from(signOrderCookie(orderId))
  const received = Buffer.from(value)
  if (expected.length !== received.length) return false
  return crypto.timingSafeEqual(expected, received)
}
