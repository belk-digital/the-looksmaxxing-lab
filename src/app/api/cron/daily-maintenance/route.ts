import { NextResponse } from 'next/server'
import { processPendingCommissions } from '@/lib/affiliates/processPending'
import { expirePendingOrders } from '@/lib/orders/expirePending'
import { processSubscriptions } from '@/lib/subscriptions/process'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { rejectUnauthorizedCron } from '@/lib/cron/auth'

// One scheduled entry (see vercel.json) so we stay within low cron-job limits on small Vercel plans.
// Each task is isolated: one failing never prevents the other from running.
export async function GET(req: Request) {
  const rejected = rejectUnauthorizedCron(req)
  if (rejected) return rejected

  const run = async <T,>(fn: () => Promise<T>) => {
    try {
      return { ok: true as const, result: await fn() }
    } catch (error: any) {
      console.error('Error in CRON daily-maintenance task:', error)
      return { ok: false as const, error: error?.message || 'failed' }
    }
  }

  const commissions = await run(processPendingCommissions)
  const orders = await run(expirePendingOrders)
  const subscriptions = await run(async () => processSubscriptions(await getPayload({ config: configPromise })))
  const ok = commissions.ok && orders.ok && subscriptions.ok
  return NextResponse.json({ commissions, orders, subscriptions }, { status: ok ? 200 : 500 })
}
