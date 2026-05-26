import React from 'react'
import { ShopClient } from '@/components/shop/ShopClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop All Compounds | The Looksmaxxing Lab',
  description: 'Browse our complete catalog of research-grade peptides and compounds. Filter by purity, category, and availability.',
}

export default function ShopPage() {
  return <ShopClient />
}
