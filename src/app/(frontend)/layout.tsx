import React, { Suspense } from 'react'
import '@/app/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { fontDisplay, fontSans } from '@/app/fonts'
import { LayoutClientWrapper } from '@/components/shared/LayoutClientWrapper'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { SmoothScroll } from '@/components/shared/SmoothScroll'
import { Toaster } from '@/components/ui/sonner'
import { GlobalNavigationSpinner } from '@/components/shared/GlobalNavigationSpinner'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'The Looksmaxxing Lab | Research-Grade Peptides, COA-Verified',
    template: '%s | The Looksmaxxing Lab',
  },
  description: 'US-based supplier of research-grade peptides with ≥99% HPLC purity and batch-specific COA verification. BPC-157, Semaglutide, Tirzepatide, GHK-Cu, and 30+ compounds. Research use only.',
  keywords: ['research peptides', 'buy peptides', 'COA verified peptides', 'HPLC tested peptides', 'research chemicals', 'BPC-157', 'Semaglutide', 'Tirzepatide', 'peptide supplier USA', 'research use only peptides', 'looksmaxxing', 'The Looksmaxxing Lab'],
  authors: [{ name: 'The Looksmaxxing Lab' }],
  creator: 'The Looksmaxxing Lab',
  publisher: 'The Looksmaxxing Lab',
  formatDetection: {
    email: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'The Looksmaxxing Lab',
    title: 'The Looksmaxxing Lab | Research-Grade Peptides, COA-Verified',
    description: 'US-based supplier of research-grade peptides with ≥99% HPLC purity and batch-specific COA verification. 30+ compounds available. Research use only.',
    url: siteUrl,
    images: [{ url: '/og/og-home.png', width: 1200, height: 630, alt: 'The Looksmaxxing Lab — Research-Grade Peptides' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Looksmaxxing Lab | Research-Grade Peptides',
    description: 'US-based supplier of research-grade peptides. ≥99% HPLC purity, COA-verified. Research use only.',
    images: ['/og/og-home.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  verification: {},
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`min-h-screen ${fontDisplay.variable} ${fontSans.variable}`} suppressHydrationWarning>
        <head>
          <link rel="author" href={`${siteUrl}/llms.txt`} type="text/plain" title="LLM Site Info" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'The Looksmaxxing Lab',
                url: siteUrl,
                logo: `${siteUrl}/favicon.ico`,
                description: 'US-based supplier of research-grade peptides and COA-verified research compounds for scientific laboratory use.',
                foundingDate: '2024',
                sameAs: [],
                contactPoint: {
                  '@type': 'ContactPoint',
                  contactType: 'customer service',
                  url: `${siteUrl}/contact`,
                },
                makesOffer: {
                  '@type': 'OfferCatalog',
                  name: 'Research Peptides & Compounds',
                  url: `${siteUrl}/shop`,
                },
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'The Looksmaxxing Lab',
                url: siteUrl,
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
                  },
                  'query-input': 'required name=search_term_string',
                },
              }),
            }}
          />
        </head>
        <body
          className="min-h-screen bg-cream text-ink antialiased"
          suppressHydrationWarning
        >
          <React.Suspense fallback={null}>
            <GlobalNavigationSpinner />
          </React.Suspense>
          <SmoothScroll>
            <LayoutClientWrapper header={<Header />} footer={<Footer />}>
              {children}
            </LayoutClientWrapper>
            <Toaster />
          </SmoothScroll>
        </body>
      </html>
    </ClerkProvider>
  )
}
