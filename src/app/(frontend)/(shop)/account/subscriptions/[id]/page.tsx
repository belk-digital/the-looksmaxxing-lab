import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { buildSubscriptionView } from '@/lib/subscriptions/view'
import { getSubscriptionSettings, allowedPaymentMethods } from '@/lib/subscriptions/settings'
import { addMonths, diffDays } from '@/lib/subscriptions/schedule'
import { SubscriptionDetailClient, type SubscriptionDetailModel } from './SubscriptionDetailClient'

export const metadata = {
  title: 'Manage Subscription',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getPayloadUser()
  if (!user) redirect('/login')

  const numericId = Number(id)
  if (!Number.isInteger(numericId)) return notFound()

  const payload = await getPayload({ config })
  const sub: any = await payload
    .findByID({ collection: 'subscriptions' as any, id: numericId, depth: 1, overrideAccess: true })
    .catch(() => null)
  const ownerId = sub && (typeof sub.owner === 'object' && sub.owner ? sub.owner.id : sub.owner)
  if (!sub || String(ownerId) !== String(user.id)) return notFound()

  const { docs: orders } = await payload.find({
    collection: 'orders',
    where: { subscription: { equals: sub.id } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const settings = await getSubscriptionSettings(payload)
  const now = new Date()
  const view = buildSubscriptionView(sub, orders as any[], {
    minDaysBetweenEarlyOrders: settings.minDaysBetweenEarlyOrders,
    daysSinceLastEarlyOrder: sub.lastEarlyOrderAt ? diffDays(new Date(sub.lastEarlyOrderAt), now) : null,
  })

  // What "skip" would do, shown before the customer confirms.
  const skipBase = new Date(view.openInvoice?.dueDate || sub.nextDueDate || now)
  const skipTo = addMonths(skipBase < now ? now : skipBase, 1)

  const firstOrderId = typeof sub.firstOrder === 'object' && sub.firstOrder ? sub.firstOrder.id : sub.firstOrder

  const model: SubscriptionDetailModel = {
    id: String(sub.id),
    reference: `SUB-${sub.id}`,
    status: sub.status,
    planMonths: sub.planMonths,
    discountPercent: sub.discountPercent,
    paymentMethod: sub.paymentMethod,
    recurringCouponCode: sub.recurringCouponCode || null,
    allowedPaymentMethods: allowedPaymentMethods(settings),
    items: (sub.items || []).map((i: any) => ({
      name: typeof i.product === 'object' && i.product ? i.product.name : 'Product',
      variant: i.variantTitle && i.variantTitle !== 'DEFAULT' ? i.variantTitle : '',
      quantity: i.quantity || 1,
    })),
    address: {
      firstName: sub.customerFirstName || '',
      lastName: sub.customerLastName || '',
      phone: sub.customerPhone || '',
      line1: sub.shippingAddress?.line1 || '',
      line2: sub.shippingAddress?.line2 || '',
      city: sub.shippingAddress?.city || '',
      state: sub.shippingAddress?.state || '',
      postalCode: sub.shippingAddress?.postalCode || '',
    },
    view,
    skipFrom: skipBase.toISOString(),
    skipTo: skipTo.toISOString(),
    firstOrderPath: firstOrderId ? `/order-confirmation/${firstOrderId}` : null,
  }

  return <SubscriptionDetailClient model={model} />
}
