/**
 * READ-ONLY check that the real app code can read the database in DATABASE_URI after the subscription migrations
 * (the same Payload queries the website runs). It only calls find / count - it never writes, and it prints counts
 * only (no customer data). Counts are compared with plain SQL counts, so it stays correct as the shop grows.
 *
 *   npx tsx scripts/subscriptions/check-live-reads.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import { Client } from 'pg'
import config from '@payload-config'

let failed = 0
const check = (name: string, ok: boolean, detail?: string) => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  - ' + detail : ''}`)
}

const url = new URL(process.env.DATABASE_URI || '')
const pg = new Client({ connectionString: process.env.DATABASE_URI, ssl: ['127.0.0.1', 'localhost'].includes(url.hostname) ? false : { rejectUnauthorized: false } })
await pg.connect()
await pg.query('BEGIN READ ONLY')
const sqlCount = async (table: string, where = '') => Number((await pg.query(`select count(*)::int as n from "${table}" ${where}`)).rows[0].n)

const payload = await getPayload({ config })

try {
  // the query that was failing in the dev server (products incl. the new subscriptionEnabled column)
  const products = await payload.find({ collection: 'products', limit: 1000, depth: 0, overrideAccess: true, pagination: false })
  check('products load (incl. subscriptionEnabled)', products.docs.length === (await sqlCount('products')), `${products.docs.length} products`)

  const some = products.docs.slice(0, 3).map((p: any) => p.id)
  const byIds = await payload.find({ collection: 'products', where: { id: { in: some } }, depth: 1, overrideAccess: true })
  check('products by id list with relations (mega-menu style query)', byIds.docs.length === some.length)

  const cats = await payload.find({ collection: 'categories', limit: 1, depth: 0, overrideAccess: true })
  if (cats.docs[0]) {
    const inCat = await payload.find({ collection: 'products', where: { categories: { in: [cats.docs[0].id] } }, limit: 5, depth: 0, overrideAccess: true })
    check('products filtered by category', Array.isArray(inCat.docs), `${inCat.docs.length} found`)
  }

  const orders = await payload.find({ collection: 'orders', limit: 2000, depth: 0, overrideAccess: true, pagination: false })
  check('orders load', orders.docs.length === (await sqlCount('orders')), `${orders.docs.length} orders`)
  const subscriptionOrders = orders.docs.filter((o: any) => o.orderType && o.orderType !== 'one_time').length
  check('subscription orders match the database', subscriptionOrders === (await sqlCount('orders', `where order_type <> 'one_time'`)), `${subscriptionOrders} subscription orders`)

  const coupons = await payload.find({ collection: 'coupons', limit: 1000, depth: 0, overrideAccess: true, pagination: false })
  check('coupons load (incl. the new subscription settings)', coupons.docs.length === (await sqlCount('coupons')), `${coupons.docs.length} coupons`)
  check('every coupon has a clear on/off value for subscriptions', coupons.docs.every((c: any) => typeof c.allowOnSubscriptions === 'boolean'))
  const flagged = coupons.docs.filter((c: any) => c.allowOnSubscriptions).length
  console.log(`      coupons switched on for subscriptions: ${flagged}`)

  const carts = await payload.find({ collection: 'carts', limit: 100, depth: 0, overrideAccess: true })
  check('carts load', carts.docs.length === (await sqlCount('carts')), `${carts.docs.length} carts`)

  const subs = await payload.count({ collection: 'subscriptions' as any, overrideAccess: true })
  check('subscriptions load', subs.totalDocs === (await sqlCount('subscriptions')), `${subs.totalDocs} subscriptions`)

  const users = await payload.count({ collection: 'users', overrideAccess: true })
  check('users load', users.totalDocs === (await sqlCount('users')), `${users.totalDocs} users`)
  const aff = await payload.count({ collection: 'affiliates', overrideAccess: true })
  check('affiliates load', aff.totalDocs === (await sqlCount('affiliates')), `${aff.totalDocs} affiliates`)
} finally {
  await pg.query('ROLLBACK')
  await pg.end()
  console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nAll read checks passed.')
  process.exit(failed ? 1 : 0)
}
