/**
 * Seeds the throwaway LOCAL end-to-end database: products, shipping, subscription plans, payment methods,
 * and a few known accounts. Run: LM_DB=lm_e2e node scripts/subscriptions/local-env.cjs npx tsx scripts/subscriptions/seed-e2e.ts
 */
import { bootPayload, seedStore, makeCustomer } from '../../tests/db/helpers'

const uri = process.env.DATABASE_URI || ''
if (!/@(127\.0\.0\.1|localhost)(:|\/)/.test(uri)) throw new Error('seed-e2e refuses to run against a non-local database')

const { payload } = await bootPayload(uri)
const store = await seedStore(payload)

const accounts: Record<string, string> = {}
for (const [key, email, role] of [
  ['admin', 'admin@e2e.test', 'admin'],
  ['alice', 'alice@e2e.test', 'customer'],
  ['bob', 'bob@e2e.test', 'customer'],
] as const) {
  await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password: 'Passw0rd!xyz', role, firstName: key[0].toUpperCase() + key.slice(1), lastName: 'Tester' } as any,
  })
  accounts[key] = email
}
void makeCustomer

console.log(JSON.stringify({ products: { subscribable: store.product.slug, oneTimeOnly: store.product2.slug }, accounts, password: 'Passw0rd!xyz' }))
process.exit(0)
