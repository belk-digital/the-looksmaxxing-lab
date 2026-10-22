import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { CertificatesClient, type COA } from './CertificatesClient'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: { absolute: 'Batch Certificates of Analysis | HPLC & LC-MS Verified | Longevia Research' },
  description: 'Downloadable batch COAs for every Longevia Research peptide: HPLC purity %, LC-MS identity confirmation, and endotoxin results traceable to the lot number.',
  alternates: { canonical: `${siteUrl}/certificates` },
  openGraph: {
    title: 'Batch Certificates of Analysis | HPLC & LC-MS Verified | Longevia Research',
    description: 'Downloadable batch COAs for every Longevia Research peptide: HPLC purity %, LC-MS identity confirmation, and endotoxin results traceable to the lot number.',
    url: `${siteUrl}/certificates`,
    images: [{ url: '/og/og-certificates.webp', width: 1200, height: 630, alt: 'Certificates of Analysis — Longevia Research' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Batch Certificates of Analysis | HPLC & LC-MS Verified | Longevia Research',
    description: 'Downloadable batch COAs for every Longevia Research peptide: HPLC purity %, LC-MS identity confirmation, and endotoxin results traceable to the lot number.',
    images: ['/og/og-certificates.webp'],
  },
}

const schemaBreadcrumbList = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Certificates of Analysis', item: `${siteUrl}/certificates` },
  ],
}

const schemaCollectionPage = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Certificates of Analysis',
  url: `${siteUrl}/certificates`,
  description: 'Genuine, downloadable Certificates of Analysis (HPLC and mass spectrometry verified) published for research peptide batches sold by Longevia Research.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Longevia Research',
    url: siteUrl,
  },
}

// Cached for 1 day. Saving a product in the Payload admin clears the cache for this page straight away
// (see src/hooks/products.ts), so edits show up without waiting for the day to pass.
export const revalidate = 86400

export default async function CertificatesPage() {
  const payload = await getPayload({ config: configPromise })

  // Read-only query, same Local API pattern already used in generateStaticParams/generateMetadata
  // for product pages. depth: 1 resolves the coaFile upload relation and its categories relation
  // so we can read real file URLs and category names without a second round-trip.
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    depth: 1,
    limit: 1000,
  })

  const coas: COA[] = docs
    .filter((p: any) => typeof p.coaFile === 'object' && p.coaFile?.url)
    .map((p: any) => {
      const category =
        Array.isArray(p.categories) && p.categories[0] && typeof p.categories[0] === 'object'
          ? p.categories[0].name
          : ''

      return {
        id: String(p.id),
        product: p.name,
        productSlug: p.slug,
        category: category || '',
        documentTitle: typeof p.coaFile.title === 'string' ? p.coaFile.title : undefined,
        uploadedDate: p.coaFile.updatedAt
          ? new Date(p.coaFile.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : undefined,
        coaUrl: p.coaFile.url,
      }
    })
    .sort((a, b) => a.product.localeCompare(b.product))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaCollectionPage) }} />
      <CertificatesClient coas={coas} />
    </>
  )
}
