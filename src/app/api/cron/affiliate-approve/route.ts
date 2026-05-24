import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  // In production, you would want to secure this endpoint via a secret token
  // e.g. if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) ...

  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()

    const pendingConversions = await payload.find({
      collection: 'affiliate-conversions',
      where: {
        and: [
          { status: { equals: 'pending' } },
          { pendingUntil: { less_than_equal: now } },
          { flaggedForReview: { equals: false } }, // Don't auto-approve if flagged
        ],
      },
      limit: 1000,
      overrideAccess: true,
    })

    const approvedIds = []
    for (const conv of pendingConversions.docs) {
      await payload.update({
        collection: 'affiliate-conversions',
        id: conv.id,
        data: {
          status: 'approved',
          approvedAt: now,
        },
        overrideAccess: true,
      })
      approvedIds.push(conv.id)
    }

    return NextResponse.json({
      success: true,
      message: `Approved ${approvedIds.length} pending conversions.`,
      approvedIds,
    })
  } catch (error: any) {
    console.error('Error running affiliate approval cron:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
