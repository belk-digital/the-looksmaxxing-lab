import { NextResponse } from 'next/server'
import { processPendingCommissions } from '@/lib/affiliates/processPending'
import { rejectUnauthorizedCron } from '@/lib/cron/auth'

// Kept for backwards compatibility; same job as /api/cron/process-commissions. It used to approve
// anything older than a flat 15 days, ignoring each affiliate's own pending period.
export async function GET(request: Request) {
  const rejected = rejectUnauthorizedCron(request)
  if (rejected) return rejected

  try {
    const result = await processPendingCommissions()
    return NextResponse.json({
      success: true,
      message: `Successfully auto-approved ${result.success} pending conversions.`,
      result,
      processedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error running affiliate approval cron:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
