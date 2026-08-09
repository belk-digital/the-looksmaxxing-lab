import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/shippingzones'],
        disallow: [
          '/admin/',
          '/admin',
          '/api/',
          '/account/',
          '/account',
          '/cart',
          '/checkout',
          '/order-confirmation/',
          '/affiliates/dashboard/',
          '/affiliates/dashboard',
          '/affiliates/apply',
          '/test-design',
          '/test-motion',
          '/run-script',
          '/add-bulk-bundles',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart', '/checkout'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart', '/checkout'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart', '/checkout'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart', '/checkout'],
      },
      {
        userAgent: 'Claude-User',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart', '/checkout'],
      },
      {
        userAgent: 'Claude-SearchBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart', '/checkout'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart', '/checkout'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart', '/checkout'],
      },
      {
        userAgent: 'Perplexity-User',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart', '/checkout'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
