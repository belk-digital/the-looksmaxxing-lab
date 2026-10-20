import { NextResponse } from 'next/server'
import { processPendingCommissions } from '@/lib/affiliates/processPending'
import { rejectUnauthorizedCron } from '@/lib/cron/auth'

// Kept for backwards compatibility; same job as /api/cron/process-commissions.
export async function GET(req: Request) {
  const rejected = rejectUnauthorizedCron(req)
  if (rejected) return rejected

  try {
    const result = await processPendingCommissions()
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Error running affiliate approval cron:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
