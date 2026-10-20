/**
 * Creates the full Payload schema in a THROWAWAY LOCAL database (never remote).
 * Run via: node scripts/subscriptions/local-env.cjs  (with PAYLOAD_DB_PUSH=true, LM_DB=<db>)
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const uri = process.env.DATABASE_URI || ''
if (!/@(127\.0\.0\.1|localhost)(:|\/)/.test(uri)) {
  throw new Error('push-schema refuses to run against a non-local database')
}

const payload = await getPayload({ config })
console.log('schema ready in local database:', new URL(uri).pathname.slice(1))
await payload.db.drizzle.$client.end?.()
process.exit(0)
