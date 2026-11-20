import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { EXPRESS_SHIPPING_NAME, EXPRESS_SHIPPING_PRICE_CENTS } from '@/lib/checkout/shipping'

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  const existing = await payload.find({
    collection: 'shippingzones',
    where: { name: { equals: 'Domestic (US Only)' } },
    overrideAccess: true,
  })

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'shippingzones',
      data: {
        name: 'Domestic (US Only)',
        methods: [
          // Every order ships by Express Shipping ($20, 2-3 business days)
          { method: EXPRESS_SHIPPING_NAME, price: EXPRESS_SHIPPING_PRICE_CENTS, estimatedDays: 2 },
        ]
      },
      overrideAccess: true,
    })
    return NextResponse.json({ success: true, message: 'Seeded Domestic US shipping zone' })
  } else {
    return NextResponse.json({ success: true, message: 'Shipping zone already exists' })
  }
}
