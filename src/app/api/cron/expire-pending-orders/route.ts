import { NextResponse } from 'next/server'
import { expirePendingOrders } from '@/lib/orders/expirePending'
import { rejectUnauthorizedCron } from '@/lib/cron/auth'

export async function GET(req: Request) {
  const rejected = rejectUnauthorizedCron(req)
  if (rejected) return rejected

  try {
    return NextResponse.json(await expirePendingOrders())
  } catch (error: any) {
    console.error('Error in CRON expire-pending-orders:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
