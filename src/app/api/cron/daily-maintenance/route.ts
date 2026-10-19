import { NextResponse } from 'next/server'
import { processPendingCommissions } from '@/lib/affiliates/processPending'
import { expirePendingOrders } from '@/lib/orders/expirePending'
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
  const ok = commissions.ok && orders.ok
  return NextResponse.json({ commissions, orders }, { status: ok ? 200 : 500 })
}
