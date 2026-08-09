import React, { Suspense } from 'react'
import Script from 'next/script'
import '@/app/globals.css'

import { fontDisplay, fontSans } from '@/app/fonts'
import { LayoutClientWrapper } from '@/components/shared/LayoutClientWrapper'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { SmoothScroll } from '@/components/shared/SmoothScroll'
import { Toaster } from '@/components/ui/sonner'
import { GlobalNavigationSpinner } from '@/components/shared/GlobalNavigationSpinner'
import { cookies } from 'next/headers'
import { AgeVerificationGate } from '@/components/shared/AgeVerificationGate'
import { NextAuthProvider } from '@/components/Providers'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Longevia Research | Research-Grade Peptides, COA-Verified',
    template: '%s | Longevia Research',
  },
  description: 'US-based supplier of research-grade peptides with ≥99% HPLC purity and batch-specific COA verification. BPC-157, Semaglutide, Tirzepatide, GHK-Cu, and 30+ compounds. Research use only.',
  keywords: ['longevia', 'longevia research', 'longeviaresearch', 'research peptides', 'buy peptides', 'COA verified peptides', 'HPLC tested peptides', 'research chemicals', 'BPC-157', 'Semaglutide', 'Tirzepatide', 'peptide supplier USA', 'research use only peptides'],
  authors: [{ name: 'Longevia Research' }],
  creator: 'Longevia Research',
  publisher: 'Longevia Research',
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Longevia Research',
    title: 'Longevia Research | Research-Grade Peptides, COA-Verified',
    description: 'US-based supplier of research-grade peptides with ≥99% HPLC purity and batch-specific COA verification. 30+ compounds available. Research use only.',
    url: siteUrl,
    images: [{ url: '/og/og-home.webp', width: 1200, height: 630, alt: 'Longevia Research — Research-Grade Peptides' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Longevia Research | Research-Grade Peptides',
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
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && { google: process.env.GOOGLE_SITE_VERIFICATION }),
    ...(process.env.BING_SITE_VERIFICATION && { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } }),
  },
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const headersList = await require('next/headers').headers()
  const userAgent = headersList.get('user-agent') || ''
  
  // SEO Fix: Search engines must bypass the age gate to index the site content
  const isBot = /bot|googlebot|google-inspectiontool|lighthouse|crawler|spider|robot|crawling|facebookexternalhit|bingbot/i.test(userAgent)
  const isVerified = cookieStore.get('longevia_age_verified')?.value === 'true' || isBot

  return (
    <html lang="en-US" className={`min-h-screen ${fontDisplay.variable} ${fontSans.variable}`} suppressHydrationWarning>
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
              name: 'Longevia Research',
              alternateName: ['Longevia', 'LongeviaResearch'],
              url: siteUrl,
              logo: `${siteUrl}/icon.png`,
              description: 'US-based supplier of research-grade peptides and COA-verified research compounds for scientific laboratory use.',
              foundingDate: '2024',
              sameAs: ['https://www.instagram.com/longeviaresearch'],
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'US',
              },
              areaServed: {
                '@type': 'Country',
                name: 'United States',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                url: `${siteUrl}/contact`,
                areaServed: 'US',
                availableLanguage: ['English'],
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
              name: 'Longevia Research',
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
          <NextAuthProvider>
            <LayoutClientWrapper header={<Header />} footer={<Footer />}>
              {children}
            </LayoutClientWrapper>
          </NextAuthProvider>
          <Toaster />
        </SmoothScroll>
      </body>
    </html>
  )
}
