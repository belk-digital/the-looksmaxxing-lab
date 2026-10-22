import React from 'react'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { buildSubscriptionView } from '@/lib/subscriptions/view'
import { SubscriptionsClient, type SubscriptionCard } from './SubscriptionsClient'

export const metadata = {
  title: 'My Subscriptions',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  const user = await getPayloadUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config })
  const { docs: subs } = await payload.find({
    collection: 'subscriptions' as any,
    where: { owner: { equals: user.id } },
    sort: '-createdAt',
    limit: 100,
    depth: 1, // product names
    overrideAccess: true,
  })

  const cards: SubscriptionCard[] = []
  for (const sub of subs as any[]) {
    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: { subscription: { equals: sub.id } },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    const view = buildSubscriptionView(sub, orders as any[])
    cards.push({
      id: String(sub.id),
      reference: `SUB-${sub.id}`,
      planMonths: sub.planMonths,
      discountPercent: sub.discountPercent,
      products: (sub.items || []).map((i: any) => `${typeof i.product === 'object' && i.product ? i.product.name : 'Product'}${i.quantity > 1 ? ` x${i.quantity}` : ''}`),
      status: sub.status,
      statusLabel: view.statusLabel,
      statusTone: view.statusTone,
      ordersPaid: view.ordersPaid,
      help: view.statusHelp,
      needsPayment: !!view.openInvoice || sub.status === 'lapsed',
    })
  }

  return <SubscriptionsClient subscriptions={cards} />
}
