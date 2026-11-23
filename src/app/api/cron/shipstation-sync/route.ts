import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { runShipStationCron } from '@/lib/shipstation/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Safety net for the ShipStation hand-off, run every 30 minutes (vercel.json): retries orders that failed to
// reach ShipStation and records shipments the webhook missed. Vercel sends "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('shipstation-sync: CRON_SECRET is not set, refusing to run')
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const payload = await getPayload({ config: configPromise })
    const summary = await runShipStationCron(payload)
    return NextResponse.json({ ok: true, ...summary })
  } catch (error: any) {
    console.error('shipstation-sync failed:', error)
    return NextResponse.json({ error: error?.message || 'failed' }, { status: 500 })
  }
}
