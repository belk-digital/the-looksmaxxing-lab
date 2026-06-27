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
  variants: { sku: string; price: string; title: string; [key: string]: any }[]
  averageRating?: number
  reviewCount?: number
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
  averageRating,
  reviewCount,
}: ProductJsonLdProps) {
  const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')
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

  const returnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'US',
    returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
    merchantReturnDays: 0,
  }

  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: '0',
      currency: 'USD',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'US',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 2,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 2,
        maxValue: 4,
        unitCode: 'DAY',
      },
    },
  }

  const offerBase = {
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: productUrl,
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: 'The Looksmaxxing Lab',
    },
    hasMerchantReturnPolicy: returnPolicy,
    shippingDetails,
  }

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

  if (averageRating && averageRating > 0 && reviewCount && reviewCount > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      reviewCount,
    }
  }

  if (hasVariants && variants.length > 1) {
    productSchema.offers = {
      '@type': 'AggregateOffer',
      ...offerBase,
      lowPrice: lowestPrice.toFixed(2),
      highPrice: highestPrice.toFixed(2),
      offerCount: variants.length,
    }
  } else {
    productSchema.offers = {
      '@type': 'Offer',
      ...offerBase,
      price: lowestPrice.toFixed(2),
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
        name: 'Shop',
        item: `${siteUrl}/shop`,
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
