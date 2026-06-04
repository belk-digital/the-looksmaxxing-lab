import React from 'react'
import { OrderDetailClient } from './OrderDetailClient'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound, redirect } from 'next/navigation'

export const metadata = {
  title: 'Order Details | The Looksmaxxing Lab',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const user = await getPayloadUser()
  if (!user) redirect('/login?redirect=/account/orders/' + id)

  const payload = await getPayload({ config })
  
  try {
    const order = await payload.findByID({
      collection: 'orders',
      id,
      depth: 1, // To get basic product info if populated, but we rely on snapshot mostly
      overrideAccess: true,
    })

    // Verify ownership
    const ownerId = typeof order.owner === 'object' ? order.owner?.id : order.owner
    if (ownerId !== user.id) {
      return notFound()
    }

    return <OrderDetailClient order={order} />
  } catch (error) {
    return notFound()
  }
}
