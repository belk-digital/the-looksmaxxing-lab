import React from 'react'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import JournalPostClient from './JournalPostClient'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'journal-posts' as any,
      limit: 1000,
      depth: 0,
    })
    return docs.filter((p: any) => p.slug).map((p: any) => ({ slug: p.slug }))
  } catch {
    // Return empty array if collection doesn't exist yet
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  let title = 'Science Journal'
  let description = 'Research and clinical guidelines from The Looksmaxxing Lab.'
  let imageUrl: string | undefined = undefined

  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'journal-posts' as any,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    
    if (docs && docs.length > 0) {
      const post = docs[0]
      title = post.title || title
      description = post.excerpt || post.metaDescription || description
      
      if (post.heroImage && typeof post.heroImage === 'object' && post.heroImage.url) {
        imageUrl = post.heroImage.url
      } else if (post.image && typeof post.image === 'object' && post.image.url) {
        imageUrl = post.image.url
      }
      
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `${siteUrl}${imageUrl}`
      }
    }
  } catch {
    // Fallback if collection doesn't exist
    // The client component is currently rendering a hardcoded post
    // so we'll provide some generic but relevant metadata
    title = 'The case for NAD+ in mitochondrial research | Science Journal'
    description = 'Nicotinamide adenine dinucleotide (NAD+) is an essential pyridine nucleotide that serves as an electron carrier in cellular metabolism.'
  }

  const postUrl = `${siteUrl}/journal/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title,
      description,
      images: imageUrl
        ? [{ url: imageUrl, width: 1200, height: 630, alt: title }]
        : [{ url: '/hero-image.png', width: 1200, height: 630, alt: 'Science Journal Post' }],
      type: 'article',
      url: postUrl,
      siteName: 'The Looksmaxxing Lab',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : ['/hero-image.png'],
    },
  }
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // We can pass params to the client component if it needs them in the future
  return <JournalPostClient />
}
