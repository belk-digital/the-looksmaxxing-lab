import React, { Suspense } from 'react'
import Script from 'next/script'
import '@/app/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { fontDisplay, fontSans } from '@/app/fonts'
import { LayoutClientWrapper } from '@/components/shared/LayoutClientWrapper'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { SmoothScroll } from '@/components/shared/SmoothScroll'
import { Toaster } from '@/components/ui/sonner'
import { GlobalNavigationSpinner } from '@/components/shared/GlobalNavigationSpinner'
import { cookies } from 'next/headers'
import { AgeVerificationGate } from '@/components/shared/AgeVerificationGate'

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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'The Looksmaxxing Lab',
    title: 'The Looksmaxxing Lab | Research-Grade Peptides, COA-Verified',
    description: 'US-based supplier of research-grade peptides with ≥99% HPLC purity and batch-specific COA verification. 30+ compounds available. Research use only.',
    url: siteUrl,
    images: [{ url: '/og/og-home.webp', width: 1200, height: 630, alt: 'The Looksmaxxing Lab — Research-Grade Peptides' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Looksmaxxing Lab | Research-Grade Peptides',
    description: 'US-based supplier of research-grade peptides. ≥99% HPLC purity, COA-verified. Research use only.',
    images: ['/og/og-home.webp'],
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

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const headersList = await require('next/headers').headers()
  const userAgent = headersList.get('user-agent') || ''
  
  // SEO Fix: Search engines must bypass the age gate to index the site content
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|bingbot/i.test(userAgent)
  const isVerified = cookieStore.get('looksmaxxing_age_verified')?.value === 'true' || isBot

  return (
    <ClerkProvider>
      <html lang="en" className={`min-h-screen ${fontDisplay.variable} ${fontSans.variable}`} suppressHydrationWarning>
        <head>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer', '${process.env.NEXT_PUBLIC_GTM_ID || 'GTM-XXXXXXX'}');
            `}
          </Script>
          <link rel="author" href={`${siteUrl}/llms.txt`} type="text/plain" title="LLM Site Info" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'The Looksmaxxing Lab',
                url: siteUrl,
                logo: `${siteUrl}/icon.png`,
                description: 'US-based supplier of research-grade peptides and COA-verified research compounds for scientific laboratory use.',
                foundingDate: '2024',
                sameAs: ['https://www.instagram.com/thelooksmaxxinglab'],
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
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID || 'GTM-XXXXXXX'}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
          <AgeVerificationGate initialVerified={isVerified} />
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
