import React from 'react'
import { ShopClient } from '@/components/shop/ShopClient'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getShopProducts } from '../(shop)/actions'

export const metadata: Metadata = {
  title: 'Shop All Compounds | The Looksmaxxing Lab',
  description: 'Browse our complete catalog of research-grade peptides and compounds. Filter by purity, category, and availability.',
}

export default async function ShopPage() {
  const payload = await getPayload({ config: configPromise })

  // Fetch all categories for the sidebar
  const categoriesRes = await payload.find({
    collection: 'categories',
    where: { isVisible: { equals: true } },
    limit: 100,
    sort: 'name',
    overrideAccess: true,
  })

  const categories = categoriesRes.docs.map(cat => ({
    id: cat.id as string | number,
    name: cat.name,
    slug: cat.slug || ''
  }))

  // Fetch initial page of products
  const initialProductsRes = await getShopProducts({ page: 1, limit: 24 })

  return (
    <ShopClient 
      initialProducts={initialProductsRes.success ? (initialProductsRes.products as any) : []} 
      totalPages={initialProductsRes.success ? initialProductsRes.totalPages : 0} 
      categories={categories} 
    />
  )
}
