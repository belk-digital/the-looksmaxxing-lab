import crypto from 'crypto'

/**
 * Guards cron endpoints. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`
 * automatically once CRON_SECRET is set on the project.
 *
 * Returns a Response to send back if the request must be rejected, or null if it may proceed.
 * In production the endpoint fails closed when CRON_SECRET is missing.
 */
export function rejectUnauthorizedCron(req: Request): Response | null {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRON_SECRET is not configured; refusing to run cron endpoint')
      return new Response('Cron not configured', { status: 500 })
    }
    return null
  }

  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(req.headers.get('authorization') ?? '')
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return new Response('Unauthorized', { status: 401 })
  }
  return null
}
