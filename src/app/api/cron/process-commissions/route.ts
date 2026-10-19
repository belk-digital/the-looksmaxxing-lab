import { NextResponse } from 'next/server'
import { processPendingCommissions } from '@/lib/affiliates/processPending'
import { rejectUnauthorizedCron } from '@/lib/cron/auth'

export async function GET(req: Request) {
  const rejected = rejectUnauthorizedCron(req)
  if (rejected) return rejected

  try {
    const result = await processPendingCommissions()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in CRON process-commissions:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
