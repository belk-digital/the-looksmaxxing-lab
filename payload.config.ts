import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './src/collections/Users'
import { Media } from './src/collections/Media'
import { Addresses } from './src/collections/Addresses'
import { Categories } from './src/collections/Categories'
import { Products } from './src/collections/Products'
import { Carts } from './src/collections/Carts'
import { Coupons } from './src/collections/Coupons'
import { BlogPosts } from './src/collections/BlogPosts'
import { Pages } from './src/collections/Pages'
import { ContactMessages } from './src/collections/ContactMessages'
import { EmailLogs } from './src/collections/EmailLogs'
import { Wishlists } from './src/collections/Wishlists'
import { Reviews } from './src/collections/Reviews'
import { Orders } from './src/collections/Orders'
import { ShippingZones } from './src/collections/ShippingZones'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Addresses,
    Categories,
    Products,
    Carts,
    Wishlists,
    Coupons,
    Orders,
    Reviews,
    ShippingZones,
    BlogPosts,
    Pages,
    ContactMessages,
    EmailLogs,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: {
          generateFileURL: ({ filename, prefix }) => {
            const publicUrl = process.env.R2_PUBLIC_URL || ''
            const base = publicUrl.replace(/\\\/$/, '')
            return prefix ? `${base}/${prefix}/${filename}` : `${base}/${filename}`
          },
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        endpoint: process.env.R2_ENDPOINT || '',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        forcePathStyle: true,
      },
      enabled: !!process.env.R2_BUCKET,
    }),
  ],
})
