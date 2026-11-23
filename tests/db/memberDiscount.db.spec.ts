/**
 * The member discount, Express shipping and the Zelle email against a REAL (throwaway, local) PostgreSQL database,
 * through the real server actions and the real Payload app. Only the login session and the email sender are faked.
 *
 * What is proved here that unit tests cannot:
 * - The two new order columns really exist, are written, and are read back (the migration's shape).
 * - A logged-in member's order is charged 15% less AND the order row says so; a guest's order is not.
 * - A coupon next to the member discount: both stored, store credit loses only its own part of the balance.
 * - Subscriptions never get the member discount.
 * - Only Express Shipping ($20) is offered, and the order records the method actually charged.
 * - The real email for an unpaid Zelle order: member discount line, delivery time and the new QR code.
 * - An order from before the member discount existed still reads and emails exactly as before.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import pg from 'pg'
import { createTestDatabase, bootPayload, seedStore, makeCustomer, lineFor, FORM, shutdown } from './helpers'

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
let sent: { to?: string; bcc?: string; subject: string; html: string }[]
let store: { product: any; product2: any }

const QR = 'https://pub-0ab0207d475a48e7b7e92a35418eace6.r2.dev/email-assets/LR_Zelle.webp'

beforeAll(async () => {
  db = await createTestDatabase()
  ;({ payload, sent } = await bootPayload(db.uri))
  store = await seedStore(payload)
  // Every order ships by Express Shipping ($20): the shop's only method, as on the live site
  const zone = (await payload.find({ collection: 'shippingzones', overrideAccess: true, limit: 1 })).docs[0]
  await payload.update({
    collection: 'shippingzones',
    id: zone.id,
    overrideAccess: true,
    data: { methods: [{ method: 'Express Shipping', price: 2000 }] } as any,
  })
})
afterAll(async () => {
  await shutdown(payload, db)
})
beforeEach(() => {
  sent.length = 0
})

const getOrder = (id: any) => payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true }) as Promise<any>
const makeCoupon = (data: Record<string, unknown>) =>
  payload.create({ collection: 'coupons', overrideAccess: true, data: { type: 'percentage', value: 10, applicableProductTypes: 'all', appliesTo: 'all', ...data } as any }) as Promise<any>
const getCoupon = async (code: string) => (await payload.find({ collection: 'coupons', where: { code: { equals: code } }, overrideAccess: true, limit: 1 })).docs[0] as any

/** Reads the raw database row, to prove the columns themselves hold the values. */
async function rawRow(id: any) {
  const client = new pg.Client({ connectionString: db.uri })
  await client.connect()
  try {
    return (await client.query('select subtotal, discount_total, member_discount_total, member_discount_percent, shipping_total, shipping_method, total from orders where id = $1', [id])).rows[0]
  } finally {
    await client.end()
  }
}

async function place(opts: { loggedIn: boolean; items?: any[]; coupon?: string; shippingName?: string; method?: 'zelle' | 'authnet_bridge'; customer?: { user: any; email: string } }) {
  const { createPayloadOrder } = await import('@/app/(frontend)/(shop)/checkout/actions')
  const c = opts.customer ?? (await makeCustomer(payload))
  if (opts.loggedIn) {
    h.user = c.user
    h.session = c.email
  } else {
    h.user = null
    h.session = ''
  }
  const method = opts.method ?? 'zelle'
  return (await createPayloadOrder(
    opts.items ?? [lineFor(store.product, null, 2)],
    opts.shippingName ?? 'Express Shipping',
    opts.coupon,
    false,
    { ...FORM, email: c.email },
    method === 'zelle' ? 'manual' : 'authnet_bridge',
    undefined,
    method,
  )) as any
}

describe('a logged-in member\'s order', () => {
  it('is charged 15% less, and the order row in the database says so', async () => {
    const res = await place({ loggedIn: true }) // 2 x $20 = $40
    expect(res.error).toBeUndefined()
    const order = await getOrder(res.orderId)
    expect(order).toMatchObject({
      subtotal: 40,
      discountTotal: 6,
      memberDiscountTotal: 6,
      memberDiscountPercent: 15,
      shippingMethod: 'Express Shipping',
      shippingTotal: 20,
      total: 54, // 40 - 6 + 20
    })
    expect(order.owner).toBeTruthy() // the order belongs to the customer's account
    // and the raw columns hold it (numeric values come back as text from the database)
    const raw = await rawRow(res.orderId)
    expect(Number(raw.member_discount_total)).toBe(6)
    expect(Number(raw.member_discount_percent)).toBe(15)
    expect(Number(raw.discount_total)).toBe(6)
    expect(raw.shipping_method).toBe('Express Shipping')
  })

  it('subtotal - discount + shipping = total, for several cart sizes', async () => {
    for (const qty of [1, 2, 3, 7]) {
      const res = await place({ loggedIn: true, items: [lineFor(store.product, null, qty)] })
      const o = await getOrder(res.orderId)
      expect(o.subtotal - o.discountTotal + o.shippingTotal).toBeCloseTo(o.total, 6)
      expect(o.memberDiscountTotal).toBeCloseTo(o.subtotal * 0.15, 2)
    }
  })

  it('sends a confirmation email that shows the member discount, the delivery time and the new Zelle QR', async () => {
    const res = await place({ loggedIn: true })
    const order = await getOrder(res.orderId)
    const email = sent.find((m) => m.html.includes(`#${order.orderNumber}`) || m.html.includes(String(order.orderNumber ?? order.id)))
    expect(email).toBeTruthy()
    const text = email!.html.replace(/<wbr>/g, '').replace(/&middot;/g, '·').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    expect(text).toContain('Member discount (15%) -$6.00')
    expect(text).toContain('You saved $6.00 with your member discount.')
    expect(text).toContain('Shipping (Express Shipping · 2-3 business days) $20.00')
    expect(text).toContain('Total $54.00')
    expect(text).toContain('please send $54.00 via Zelle')
    expect(email!.html).toContain(`src="${QR}"`)
    expect(email!.html).not.toContain('longevia-zelle-qr')
  })

  it('also gets the discount on a card (bridge) order', async () => {
    const res = await place({ loggedIn: true, method: 'authnet_bridge' })
    expect(res.error).toBeUndefined()
    expect(await getOrder(res.orderId)).toMatchObject({ memberDiscountTotal: 6, total: 54, paymentMethod: 'authnet_bridge' })
  })
})

describe('a guest\'s order', () => {
  it('is charged in full, and the order row says there was no member discount', async () => {
    const res = await place({ loggedIn: false })
    expect(res.error).toBeUndefined()
    const order = await getOrder(res.orderId)
    expect(order).toMatchObject({ subtotal: 40, discountTotal: 0, memberDiscountTotal: 0, shippingTotal: 20, total: 60 })
    expect(order.memberDiscountPercent == null).toBe(true)
    const raw = await rawRow(res.orderId)
    expect(Number(raw.member_discount_total)).toBe(0)
    expect(raw.member_discount_percent).toBeNull()
  })

  it('its email has no member discount line', async () => {
    const res = await place({ loggedIn: false })
    const order = await getOrder(res.orderId)
    const email = sent.find((m) => m.html.includes(String(order.orderNumber ?? order.id)))
    const text = email!.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    expect(text).not.toContain('Member discount')
    expect(text).not.toContain('You saved')
    expect(text).toContain('Total $60.00')
    expect(email!.html).toContain(`src="${QR}"`) // the Zelle QR is for every Zelle order, member or not
  })
})

describe('the member discount cannot be combined with a discount code: whichever saves more', () => {
  const emailText = (order: any) =>
    sent
      .find((m) => m.html.includes(String(order.orderNumber ?? order.id)))!
      .html.replace(/<wbr>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')

  it('a code worth LESS (10% = $4 < $6): the member discount applies, the code is NOT used, recorded or counted', async () => {
    await makeCoupon({ code: 'TEN', type: 'percentage', value: 10 }) // 10% of $40 = $4 (coupon rules round down to whole dollars)
    const res = await place({ loggedIn: true, coupon: 'TEN' })
    expect(res.error).toBeUndefined()
    const o = await getOrder(res.orderId)
    expect(o).toMatchObject({ discountTotal: 6, memberDiscountTotal: 6, memberDiscountPercent: 15, couponCode: '', total: 54 }) // 40 - 6 + 20
    // the code was not used up
    expect((await getCoupon('TEN')).usageCount ?? 0).toBe(0)
    // the email has the member line and no code line
    const text = emailText(o)
    expect(text).toContain('Member discount (15%) -$6.00')
    expect(text).not.toContain('Discount (TEN)')
  })

  it('a code worth MORE (50% = $20 > $6): the code applies alone, is recorded and counted, and the order says no member discount', async () => {
    await makeCoupon({ code: 'HALF', type: 'percentage', value: 50 })
    const res = await place({ loggedIn: true, coupon: 'HALF' })
    expect(res.error).toBeUndefined()
    const o = await getOrder(res.orderId)
    expect(o).toMatchObject({ discountTotal: 20, memberDiscountTotal: 0, couponCode: 'HALF', total: 40 }) // 40 - 20 + 20
    expect(o.memberDiscountPercent == null).toBe(true)
    expect((await getCoupon('HALF')).usageCount).toBe(1)
    const text = emailText(o)
    expect(text).toContain('Discount (HALF) -$20.00')
    expect(text).not.toContain('Member discount')
    expect(text).not.toContain('You saved')
  })

  it('a guest with the same coupon gets only the coupon', async () => {
    const res = await place({ loggedIn: false, coupon: 'TEN' })
    expect(await getOrder(res.orderId)).toMatchObject({ discountTotal: 4, memberDiscountTotal: 0, total: 56 })
  })

  it('a gift card (store credit) is the exception: paid on top, the member discount comes off first and the rest of the balance is kept', async () => {
    await makeCoupon({ code: 'CREDIT50', type: 'store_credit', storeCreditAmount: 5000 }) // $50.00 of credit
    const res = await place({ loggedIn: true, coupon: 'CREDIT50' })
    expect(res.error).toBeUndefined()
    const o = await getOrder(res.orderId)
    // $40 order: member $6, store credit takes the other $34 (never more than the subtotal) -> only shipping is left to pay
    expect(o).toMatchObject({ subtotal: 40, memberDiscountTotal: 6, discountTotal: 40, total: 20 })
    // finalizing (the Zelle path does it straight away) deducts only the $34 the credit actually paid
    const coupon = await getCoupon('CREDIT50')
    expect(coupon.remainingBalance).toBe(1600) // 5000 - 3400 cents
    expect(coupon.usageCount).toBe(1)
  })
})

describe('subscriptions', () => {
  it('never get the member discount: a logged-in customer starting a plan pays the plan price only', async () => {
    const { createPayloadOrder } = await import('@/app/(frontend)/(shop)/checkout/actions')
    const c = await makeCustomer(payload)
    h.user = c.user
    h.session = c.email
    const res: any = await createPayloadOrder(
      [lineFor(store.product, 3, 2)], // every 3 months: 20% plan discount -> $16 each
      'Express Shipping',
      undefined,
      false,
      { ...FORM, email: c.email, acceptSubscriptionTerms: true },
      'manual',
      undefined,
      'zelle',
    )
    expect(res.error).toBeUndefined()
    const o = await getOrder(res.orderId)
    expect(o).toMatchObject({ orderType: 'subscription_first', memberDiscountTotal: 0, discountTotal: 0, subscriptionDiscountPercent: 20 })
    expect(o.memberDiscountPercent == null).toBe(true)
    expect(o.subtotal).toBe(32)
    expect(o.total).toBe(52) // 32 + 20 shipping
  })
})

describe('shipping: only Express Shipping, $20', () => {
  it('offers only that method', async () => {
    const { getShippingMethods } = await import('@/app/(frontend)/(shop)/checkout/actions')
    const methods = await getShippingMethods()
    expect(methods.map((m: any) => [m.method, m.price])).toEqual([['Express Shipping', 2000]])
  })

  it.each(['Standard Shipping', 'Free Shipping', ''])('a page still asking for "%s" is charged Express and the order says Express', async (stale) => {
    const res = await place({ loggedIn: false, shippingName: stale })
    const o = await getOrder(res.orderId)
    expect(o).toMatchObject({ shippingMethod: 'Express Shipping', shippingTotal: 20 })
    expect(Number((await rawRow(res.orderId)).shipping_method === 'Express Shipping')).toBe(1)
  })
})

describe('an order from before the member discount existed', () => {
  it('reads back with "no member discount" and its email is exactly as it always was', async () => {
    // created the way the old code created orders: without the new fields
    const old: any = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        guestEmail: 'old@example.com',
        customerFirstName: 'Old',
        customerLastName: 'Customer',
        shippingAddress: { line1: '1 Main St', city: 'Austin', state: 'TX', postalCode: '73301', country: 'US' },
        items: [{ product: store.product.id, variant: 'DEFAULT', price: 20, quantity: 3, productSnapshot: store.product }],
        status: 'paid',
        paymentStatus: 'captured',
        subtotal: 60,
        discountTotal: 6,
        shippingTotal: 5,
        taxTotal: 0,
        total: 59,
        shippingMethod: 'Standard Shipping',
        couponCode: 'OLDCODE',
        paymentMethod: 'stripe',
      } as any,
    })
    const read = await getOrder(old.id)
    expect(read.memberDiscountTotal).toBe(0) // the column default
    expect(read.memberDiscountPercent == null).toBe(true)

    const { generateOrderInvoiceHtml } = await import('@/lib/emails/generateOrderEmail')
    const text = (await generateOrderInvoiceHtml(read, payload)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    expect(text).toContain('Discount (OLDCODE) -$6.00')
    expect(text).toContain('Shipping (Standard Shipping) $5.00') // no delivery time is invented for a method that has none on record
    expect(text).not.toContain('Member discount')
    expect(text).not.toContain('You saved')
    expect(text).not.toContain('LR_Zelle')
  })
})
