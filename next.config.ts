import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-4c2ad32bd46946819b7bd8c103044a10.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.thelooksmaxxinglab.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  async redirects() {
    return [
      // 1. Non-www to www redirect (already existed and is correct)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'thelooksmaxxinglab.com',
          },
        ],
        destination: 'https://www.thelooksmaxxinglab.com/:path*',
        permanent: true,
      },
      // 2. Legacy WooCommerce product URLs to Next.js product URLs
      {
        source: '/product/:slug*',
        destination: '/products/:slug*',
        permanent: true,
      },
      // 3. Legacy Cart URLs
      {
        source: '/cart-2',
        destination: '/cart',
        permanent: true,
      },
      // 4. Legacy checkout URLs if any
      {
        source: '/checkout-2',
        destination: '/checkout',
        permanent: true,
      },
      // 5. Common WordPress default pages
      {
        source: '/hello-world',
        destination: '/journal',
        permanent: true,
      },
      // 6. WordPress Login
      {
        source: '/wp-login.php',
        destination: '/login',
        permanent: true,
      },
      // 7. WordPress Feeds
      {
        source: '/comments/feed',
        destination: '/journal',
        permanent: true,
      },
      {
        source: '/feed',
        destination: '/journal',
        permanent: true,
      },
      // 8. Product Renames
      {
        source: '/products/retatrutide',
        destination: '/products/glp-3',
        permanent: true,
      },
      {
        source: '/shop/retatrutide',
        destination: '/shop/glp-3',
        permanent: true,
      },
      // 9. BAC Water to Reconstitution Solution
      {
        source: '/bac-water',
        destination: '/reconstitution-solution',
        permanent: true,
      },
      {
        source: '/products/bac-water',
        destination: '/products/reconstitution-solution',
        permanent: true,
      },
      {
        source: '/shop/bac-water',
        destination: '/shop/reconstitution-solution',
        permanent: true,
      }
    ]
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
