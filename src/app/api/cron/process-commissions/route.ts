import { NextResponse } from 'next/server'
import { processPendingCommissions } from '@/lib/affiliates/processPending'

// Set standard max duration if you are on Vercel Pro/Enterprise, else default is usually fine
// export const maxDuration = 300; 

export async function GET(req: Request) {
  // 1. Basic security check (e.g. check for a cron secret header to prevent unauthorized runs)
  // Example for Vercel Cron:
  /*
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  */

  try {
    const result = await processPendingCommissions()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in CRON process-commissions:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
