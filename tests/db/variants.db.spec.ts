import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createTestDatabase, bootPayload, seedStore, makeCustomer, stockOf, shutdown, FORM } from './helpers'

// Products with size variants (like BPC-157: 5mg / 10mg) - most of the real catalogue - must work with plans.

const h = vi.hoisted(() => ({ session: '' as string, user: null as any, jar: new Map<string, string>() }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (n: string) => (h.jar.has(n) ? { value: h.jar.get(n) } : undefined), set: (n: string, v: string) => void h.jar.set(n, v) }),
  headers: async () => new Headers(),
}))
vi.mock('next-auth/next', () => ({ getServerSession: async () => (h.session ? { user: { email: h.session } } : null) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/auth/getPayloadUser', () => ({ getPayloadUser: async () => h.user }))

let db: Awaited<ReturnType<typeof createTestDatabase>>
let payload: any
let product: any

beforeAll(async () => {
  db = await createTestDatabase()
  ;({ payload } = await bootPayload(db.uri))
  await seedStore(payload)
  product = await payload.create({
    collection: 'products',
    overrideAccess: true,
    data: {
      name: 'BPC-157 sizes',
      slug: 'bpc-157-sizes',
      price: 90,
      stock: 100,
      status: 'active',
      isVisible: true,
      hasVariants: true,
      subscriptionEnabled: true,
      variants: [
        { sku: 'BPC-5MG', price: 90, stock: 50, options: [{ key: 'Size', value: '5mg' }] },
        { sku: 'BPC-10MG', price: 99, stock: 50, options: [{ key: 'Size', value: '10mg' }] },
      ],
    } as any,
  })
})
afterAll(async () => {
  await shutdown(payload, db)
})

const line = (sku: string, price: number, planMonths: number | null, qty = 1) => ({
  lineId: 'line-' + sku,
  productId: String(product.id),
  variantSku: sku,
  variantTitle: sku,
  quantity: qty,
  priceSnapshot: price,
  planMonths,
  product: { id: String(product.id), name: product.name, imageUrl: null },
})

async function subscribe(sku: string, price: number, months = 3) {
  const { user, email } = await makeCustomer(payload)
  h.user = user
  h.session = email
  const { createPayloadOrder } = await import('@/app/(frontend)/(shop)/checkout/actions')
  const res: any = await createPayloadOrder(
    [line(sku, price, months)],
    'Standard Shipping',
    undefined,
    false,
    { ...FORM, email, acceptSubscriptionTerms: true },
    'manual',
    undefined,
    'zelle',
  )
  return { res, user, email }
}
const getOrder = (id: any) => payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true }) as Promise<any>
const getSub = (id: any) => payload.findByID({ collection: 'subscriptions', id, depth: 0, overrideAccess: true }) as Promise<any>

describe('subscribing to a product with size variants', () => {
  it('prices the chosen size with the plan discount (10mg: $99 -> $84.15) and remembers the size', async () => {
    const { res } = await subscribe('BPC-10MG', 84.15)
    expect(res.error).toBeUndefined()
    const order = await getOrder(res.orderId)
    expect(order.subtotal).toBeCloseTo(84.15, 2)
    expect(order.total).toBeCloseTo(84.15 + 5, 2) // + $5 standard shipping
    expect(order.orderType).toBe('subscription_first')
    const sub = await getSub(order.subscription)
    expect(sub.items[0]).toMatchObject({ variantSku: 'BPC-10MG', quantity: 1 })
  })

  it('a price the browser got wrong (5mg shown with the 10mg price) is caught, not charged', async () => {
    const { res } = await subscribe('BPC-5MG', 84.15) // 5mg really costs $90 -> $76.50 with the plan
    expect(res.error).toBeTruthy()
    expect(res.priceChanged).toBe(true)
  })

  it('the 5mg size prices correctly too ($90 -> $76.50)', async () => {
    const { res } = await subscribe('BPC-5MG', 76.5)
    expect(res.error).toBeUndefined()
    expect((await getOrder(res.orderId)).subtotal).toBeCloseTo(76.5, 2)
  })

  it('a unit price that is already a sale price on the variant uses the sale price', async () => {
    const p: any = await payload.findByID({ collection: 'products', id: product.id, depth: 0, overrideAccess: true })
    const variants = p.variants.map((v: any) => (v.sku === 'BPC-5MG' ? { ...v, salePrice: 80 } : v))
    await payload.update({ collection: 'products', id: product.id, data: { variants } as any, overrideAccess: true })
    const { res } = await subscribe('BPC-5MG', 68) // 80 * 0.85
    expect(res.error).toBeUndefined()
    expect((await getOrder(res.orderId)).subtotal).toBeCloseTo(68, 2)
    const back = variants.map((v: any) => ({ ...v, salePrice: null }))
    await payload.update({ collection: 'products', id: product.id, data: { variants: back } as any, overrideAccess: true })
  })
})

describe('later months of a variant subscription', () => {
  it('month 2 uses the same size at the CURRENT live price (-15%), reserves stock, and pausing gives it back', async () => {
    const { res, user } = await subscribe('BPC-10MG', 84.15)
    await payload.update({ collection: 'orders', id: res.orderId, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })
    const subId = (await getOrder(res.orderId)).subscription

    // the store raises the 10mg price from $99 to $110 before month 2
    const p: any = await payload.findByID({ collection: 'products', id: product.id, depth: 0, overrideAccess: true })
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { variants: p.variants.map((v: any) => (v.sku === 'BPC-10MG' ? { ...v, price: 110 } : v)) } as any,
      overrideAccess: true,
    })

    const { orderNextMonthNow, pauseSubscription } = await import('@/lib/subscriptions/service')
    const stockBefore = await stockOf(payload, product.id)
    const next: any = await orderNextMonthNow(payload, subId)
    expect(next.ok).toBe(true)
    const invoice = await getOrder(next.orderId)
    expect(invoice.subtotal).toBeCloseTo(93.5, 2) // 110 * 0.85
    expect(invoice.cycleNumber).toBe(2)
    const items = (await payload.findByID({ collection: 'orders', id: next.orderId, depth: 0, overrideAccess: true })) as any
    expect(items.items[0].variant).toBe('BPC-10MG')
    expect(await stockOf(payload, product.id)).toBe(stockBefore - 1)

    expect(await pauseSubscription(payload, subId)).toEqual({ ok: true })
    expect(await stockOf(payload, product.id)).toBe(stockBefore) // the unpaid invoice was cancelled, stock is back
    void user
  })
})
