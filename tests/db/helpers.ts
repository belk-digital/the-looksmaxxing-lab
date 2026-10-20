import { randomBytes } from 'crypto'
import { Client } from 'pg'

const PG = { host: '127.0.0.1', port: 54329, user: 'postgres', password: 'postgres' }

/** A fresh, private copy of the migrated production-like database for one test file. */
export async function createTestDatabase() {
  const name = 'lm_t_' + randomBytes(4).toString('hex')
  const admin = new Client({ ...PG, database: 'postgres' })
  await admin.connect()
  await admin.query(`select pg_terminate_backend(pid) from pg_stat_activity where datname='lm_migrated_tpl' and pid<>pg_backend_pid()`)
  await admin.query(`create database ${name} template lm_migrated_tpl`)
  await admin.end()
  return {
    name,
    uri: `postgres://postgres:postgres@127.0.0.1:54329/${name}`,
    async drop() {
      const a = new Client({ ...PG, database: 'postgres' })
      await a.connect()
      await a.query(`select pg_terminate_backend(pid) from pg_stat_activity where datname='${name}' and pid<>pg_backend_pid()`)
      await a.query(`drop database if exists ${name}`)
      await a.end()
    },
  }
}

/** Boots the real Payload app against the given LOCAL database, with outgoing email captured in `sent`. */
export async function bootPayload(uri: string) {
  if (!/@(127\.0\.0\.1|localhost)(:|\/)/.test(uri)) throw new Error('refusing to run integration tests against a non-local database')
  process.env.DATABASE_URI = uri
  process.env.DATABASE_URL = ''
  process.env.PAYLOAD_DB_PUSH = 'false'
  const { getPayload } = await import('payload')
  const config = (await import('@payload-config')).default
  const payload = await getPayload({ config })
  const sent: { to?: string; bcc?: string; subject: string; html: string }[] = []
  ;(payload as any).sendEmail = async (msg: any) => {
    sent.push(msg)
  }
  return { payload, sent }
}

/**
 * Payload keeps one connection checked out for its whole life (verified: it is there right after boot and
 * never grows), so the pool can't be ended gracefully. Mute the expected "connection terminated" errors and
 * let the database drop disconnect everything.
 */
export async function shutdown(payload: any, db: { drop: () => Promise<void> } | undefined) {
  try {
    payload?.db?.pool?.on?.('error', () => undefined)
  } catch {
    /* ignore */
  }
  await db?.drop()
}

export const FORM = {
  email: 'buyer@example.com',
  firstName: 'Cathy',
  lastName: 'Buyer',
  phone: '5551234567',
  address: '1 Main St',
  apartment: '',
  city: 'New York',
  state: 'NY',
  zip: '10001',
}

/** Store content every test needs: staff + product(s), a shipping method, enabled subscription settings. */
export async function seedStore(payload: any, opts: { productPrice?: number; stock?: number } = {}) {
  const product: any = await payload.create({
    collection: 'products',
    overrideAccess: true,
    data: { name: 'BPC-157', slug: 'bpc-157', price: opts.productPrice ?? 20, stock: opts.stock ?? 100, status: 'active', isVisible: true, subscriptionEnabled: true } as any,
  })
  const product2: any = await payload.create({
    collection: 'products',
    overrideAccess: true,
    data: { name: 'TB-500', slug: 'tb-500', price: 30, stock: 100, status: 'active', isVisible: true, subscriptionEnabled: false } as any,
  })
  await payload.create({
    collection: 'shippingzones',
    overrideAccess: true,
    data: { name: 'US', methods: [{ method: 'Standard Shipping', price: 500, estimatedDays: 5 }, { method: 'Express Shipping', price: 2500, estimatedDays: 2 }] } as any,
  })
  await payload.updateGlobal({
    slug: 'subscription-settings',
    data: {
      enabled: true,
      plans: [
        { months: 3, label: '3 Months', discountPercent: 15, isActive: true },
        { months: 6, label: '6 Months', discountPercent: 15, isActive: true },
        { months: 12, label: '12 Months', discountPercent: 15, isActive: true },
      ],
    } as any,
  })
  await payload.updateGlobal({
    slug: 'payment-methods-settings',
    data: {
      methods: [
        { methodId: 'stripe', label: 'Card (Stripe)', isActive: true },
        { methodId: 'zelle', label: 'Zelle', isActive: true },
        { methodId: 'authnet_bridge', label: 'Credit Card (via Longevia Beauty)', description: '', isActive: true },
      ],
    } as any,
  })
  return { product, product2 }
}

let userCounter = 0
export async function makeCustomer(payload: any, tag = '') {
  userCounter++
  const email = `cust${tag}${userCounter}_${randomBytes(2).toString('hex')}@example.com`
  const user: any = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password: 'Passw0rd!xyz', role: 'customer', firstName: 'Cathy', lastName: 'Buyer', phone: '' } as any,
  })
  return { user, email }
}

export const lineFor = (product: any, planMonths: number | null, qty = 2, price?: number) => ({
  lineId: 'line-' + randomBytes(3).toString('hex'),
  productId: String(product.id),
  variantSku: 'DEFAULT',
  variantTitle: 'DEFAULT',
  quantity: qty,
  priceSnapshot: price ?? (planMonths ? Math.round(product.price * 85) / 100 : product.price),
  planMonths,
  product: { id: String(product.id), name: product.name, imageUrl: null },
})

export const stockOf = async (payload: any, productId: any) =>
  ((await payload.findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true })) as any).stock as number

/**
 * Creates a customer with an ACTIVE subscription (checkout, then the first payment confirmed), exactly the way
 * the real flow does it. `env.setUser` points the faked browser session at that customer.
 */
export async function startActiveSubscription(
  env: { payload: any; store: { product: any; product2: any }; setUser: (user: any, email: string) => void },
  opts: { months?: number; method?: 'zelle' | 'authnet_bridge'; qty?: number; couponCode?: string; markPaid?: boolean } = {},
) {
  const { payload, store } = env
  const months = opts.months ?? 3
  const method = opts.method ?? 'zelle'
  const { user, email } = await makeCustomer(payload)
  env.setUser(user, email)
  const { createPayloadOrder } = await import('@/app/(frontend)/(shop)/checkout/actions')
  const res: any = await createPayloadOrder(
    [lineFor(store.product, months, opts.qty ?? 2)],
    'Standard Shipping',
    opts.couponCode,
    false,
    { ...FORM, email, acceptSubscriptionTerms: true },
    method === 'zelle' ? 'manual' : 'authnet_bridge',
    undefined,
    method,
  )
  if (res.error) throw new Error('checkout failed: ' + res.error)
  const order: any = await payload.findByID({ collection: 'orders', id: res.orderId, depth: 0, overrideAccess: true })
  if (opts.markPaid !== false) {
    await payload.update({ collection: 'orders', id: order.id, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })
  }
  return { user, email, subId: order.subscription as number, firstOrderId: order.id as number }
}
