import React from 'react'
import { OrderDetailClient } from './OrderDetailClient'

export const metadata = {
  title: 'Order Details | The Looksmaxxing Lab',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <OrderDetailClient id={id} />
}
