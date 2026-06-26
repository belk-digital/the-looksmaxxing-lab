import React from 'react'

interface ProductJsonLdProps {
  name: string
  slug: string
  description: string
  price: number
  salePrice?: number
  sku?: string
  images: string[]
  categories: string[]
  faqs: { question: string; answer: string }[]
  hasVariants: boolean
  variants: { sku: string; price: string; title: string }[]
}

export function ProductJsonLd({
  name,
  slug,
  description,
  price,
  salePrice,
  sku,
  images,
  categories,
  faqs,
  hasVariants,
  variants,
}: ProductJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://the-looksmaxxing-lab.vercel.app'
  const productUrl = `${siteUrl}/products/${slug}`

  const imageUrls = images.map((img) =>
    img.startsWith('http') ? img : `${siteUrl}${img}`,
  )

  const lowestPrice = hasVariants && variants.length > 0
    ? Math.min(...variants.map((v) => parseFloat(v.price.replace('$', ''))))
    : salePrice || price

  const highestPrice = hasVariants && variants.length > 0
    ? Math.max(...variants.map((v) => parseFloat(v.price.replace('$', ''))))
    : salePrice || price

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description.substring(0, 300),
    url: productUrl,
    brand: {
      '@type': 'Brand',
      name: 'The Looksmaxxing Lab',
    },
    category: categories[0] || 'Research Peptides',
    ...(sku && { sku }),
    ...(imageUrls.length > 0 && { image: imageUrls }),
  }

  if (hasVariants && variants.length > 1) {
    productSchema.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: lowestPrice.toFixed(2),
      highPrice: highestPrice.toFixed(2),
      offerCount: variants.length,
      availability: 'https://schema.org/InStock',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: 'The Looksmaxxing Lab',
      },
    }
  } else {
    productSchema.offers = {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: lowestPrice.toFixed(2),
      availability: 'https://schema.org/InStock',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: 'The Looksmaxxing Lab',
      },
    }
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${siteUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Research Peptides',
        item: `${siteUrl}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: productUrl,
      },
    ],
  }

  const schemas: Record<string, unknown>[] = [productSchema, breadcrumbSchema]

  if (faqs.length > 0) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }
    schemas.push(faqSchema)
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
