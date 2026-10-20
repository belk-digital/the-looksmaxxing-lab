import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  try {
    // Run all counts in parallel for performance
    const [ordersRes, affiliatesRes, reviewsRes, subscriptionsRes] = await Promise.all([
      payload.count({
        collection: 'orders',
        where: { status: { equals: 'pending' } },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'affiliate-applications',
        where: { status: { equals: 'pending' } },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'reviews',
        where: { status: { equals: 'pending' } },
        overrideAccess: true,
      }),
      // Subscriptions waiting for a first payment, or put on hold because an invoice went unpaid.
      // Isolated so a subscriptions problem can never break the other badges.
      payload
        .count({
          collection: 'subscriptions' as any,
          where: { status: { in: ['pending_payment', 'lapsed'] } },
          overrideAccess: true,
        })
        .catch(() => ({ totalDocs: 0 })),
    ])

    return NextResponse.json({
      orders: ordersRes.totalDocs,
      affiliates: affiliatesRes.totalDocs,
      reviews: reviewsRes.totalDocs,
      subscriptions: subscriptionsRes.totalDocs,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
