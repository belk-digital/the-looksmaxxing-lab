import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { assertShipStationUrl } from '@/lib/shipstation/client'
import { handleShipNotify } from '@/lib/shipstation/sync'
import { verifyShipstationWebhookToken } from '@/lib/shipstation/webhookAuth'

export const maxDuration = 60

// ShipStation calls this when a shipping label is created (SHIP_NOTIFY). V1 webhooks are unsigned and their body
// only names a resource, so: (1) the URL we registered carries a secret token, (2) the resource_url is only ever
// fetched if it points at ShipStation's own API (our credentials are attached to that request), and (3) the data
// used is what ShipStation returns for it, never anything in the webhook body itself.
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!verifyShipstationWebhookToken(token, process.env.SHIPSTATION_API_SECRET || '')) {
    console.warn('ShipStation webhook: rejected, missing or invalid token')
    return new Response('Forbidden', { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  if (body?.resource_type !== 'SHIP_NOTIFY' && body?.resource_type !== 'ITEM_SHIP_NOTIFY') {
    return new Response('Ignored', { status: 200 })
  }
  const resourceUrl = body?.resource_url
  try {
    if (typeof resourceUrl !== 'string') throw new Error('no resource_url')
    assertShipStationUrl(resourceUrl)
  } catch {
    console.warn('ShipStation webhook: rejected, resource_url is not a ShipStation API URL')
    return new Response('Bad request', { status: 400 })
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await handleShipNotify(payload, resourceUrl)
    console.log(`ShipStation webhook: ${result.shipments} shipment(s), ${result.updated} order(s) updated, ${result.alerted} alert(s)`)
    return Response.json({ ok: true, ...result })
  } catch (error: any) {
    // 500 makes ShipStation retry the delivery; handleShipNotify is idempotent so a retry is safe.
    console.error('ShipStation webhook error:', error)
    return new Response(`Webhook Error: ${error?.message || 'failed'}`, { status: 500 })
  }
}
