import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createTestDatabase, bootPayload, seedStore, makeCustomer, lineFor, shutdown, FORM } from './helpers'

// Coupons on subscriptions: a coupon is rejected on a subscription unless it was switched on for subscriptions
// (default off); a switched-on coupon can discount the first order only, or every order.

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
let store: { product: any; product2: any }

const NOT_ALLOWED = "This coupon can't be used on subscriptions."

beforeAll(async () => {
  db = await createTestDatabase()
  ;({ payload } = await bootPayload(db.uri))
  store = await seedStore(payload) // BPC-157 at $20 -> $17 with the 15% discount of the 6-month plan
})
afterAll(async () => {
  await shutdown(payload, db)
})

const makeCoupon = (data: Record<string, unknown>) =>
  payload.create({ collection: 'coupons', overrideAccess: true, data: { type: 'percentage', value: 10, applicableProductTypes: 'all', appliesTo: 'all', ...data } as any }) as Promise<any>
const getCoupon = async (code: string) => (await payload.find({ collection: 'coupons', where: { code: { equals: code } }, overrideAccess: true, limit: 1 })).docs[0] as any
const getOrder = (id: any) => payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true }) as Promise<any>
const getSub = (id: any) => payload.findByID({ collection: 'subscriptions', id, depth: 0, overrideAccess: true }) as Promise<any>
const countOrders = async () => (await payload.count({ collection: 'orders', overrideAccess: true })).totalDocs as number

async function login() {
  const { user, email } = await makeCustomer(payload)
  h.user = user
  h.session = email
  return { user, email }
}

/** Starts a subscription (2 x BPC-157, an order every 6 months, Zelle) with a coupon, exactly as the checkout does. */
async function subscribeWith(couponCode: string | undefined, qty = 2) {
  const { user, email } = await login()
  const { createPayloadOrder } = await import('@/app/(frontend)/(shop)/checkout/actions')
  const res: any = await createPayloadOrder(
    [lineFor(store.product, 6, qty)],
    'Standard Shipping',
    couponCode,
    false,
    { ...FORM, email, acceptSubscriptionTerms: true },
    'manual',
    undefined,
    'zelle',
  )
  return { res, user, email }
}
const pay = (orderId: any) => payload.update({ collection: 'orders', id: orderId, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })

/** Pays order 1, then creates and pays orders 2, 3, ...; returns the invoices. */
async function runOrders(subId: any, firstOrderId: any, upTo = 3) {
  const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
  await pay(firstOrderId)
  const invoices: any[] = []
  for (let order = 2; order <= upTo; order++) {
    const r: any = await orderNextMonthNow(payload, subId)
    expect(r.ok, `order ${order}`).toBe(true)
    invoices.push(await getOrder(r.orderId))
    await pay(r.orderId)
  }
  return invoices
}

describe('the coupon form', () => {
  it('"Can be used on subscriptions" is OFF by default; the scope defaults to the first order only', async () => {
    const c = await makeCoupon({ code: 'DEFAULTS' })
    expect(c.allowOnSubscriptions).toBe(false)
    expect(c.subscriptionDiscountScope).toBe('first_month')
  })

  it('store-credit coupons cannot discount every order; first order only is fine', async () => {
    await expect(makeCoupon({ code: 'CREDIT-EVERY', type: 'store_credit', storeCreditAmount: 5000, allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' })).rejects.toThrow(
      /Store credit coupons can only discount the first order/,
    )
    const ok = await makeCoupon({ code: 'CREDIT-FIRST', type: 'store_credit', storeCreditAmount: 5000, allowOnSubscriptions: true, subscriptionDiscountScope: 'first_month' })
    expect(ok.allowOnSubscriptions).toBe(true)
  })

  it('an "every order" choice on a coupon that is switched OFF is tidied back to the first order only', async () => {
    const c = await makeCoupon({ code: 'OFF-BUT-EVERY', allowOnSubscriptions: false, subscriptionDiscountScope: 'every_month' })
    expect(c.subscriptionDiscountScope).toBe('first_month')
  })
})

describe('verifyCoupon (what the customer sees when applying a code)', () => {
  beforeAll(async () => {
    await makeCoupon({ code: 'PLAIN10' })
    await makeCoupon({ code: 'SUBFIRST10', allowOnSubscriptions: true, subscriptionDiscountScope: 'first_month' })
    await makeCoupon({ code: 'SUBALL10', allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' })
  })

  it('on a subscription cart: a normal coupon is rejected with a clear message; switched-on coupons are accepted and report their scope', async () => {
    const { verifyCoupon } = await import('@/app/(frontend)/(shop)/actions')
    await login()
    const items = [lineFor(store.product, 6, 2)]
    expect(await verifyCoupon('PLAIN10', 34, items)).toMatchObject({ valid: false, error: NOT_ALLOWED })
    expect(await verifyCoupon('plain10', 34, items)).toMatchObject({ valid: false, error: NOT_ALLOWED }) // codes are not case sensitive
    expect(await verifyCoupon('SUBFIRST10', 34, items)).toMatchObject({ valid: true, subscriptionScope: 'first_month' })
    expect(await verifyCoupon('SUBALL10', 34, items)).toMatchObject({ valid: true, subscriptionScope: 'every_month' })
  })

  it('on a normal purchase nothing changed: every coupon works as before, whatever its subscription setting', async () => {
    const { verifyCoupon } = await import('@/app/(frontend)/(shop)/actions')
    await login()
    const items = [lineFor(store.product, null, 2)]
    for (const code of ['PLAIN10', 'SUBFIRST10', 'SUBALL10']) {
      const r: any = await verifyCoupon(code, 40, items)
      expect(r.valid, code).toBe(true)
      expect(r.subscriptionScope, code).toBeNull()
    }
  })

  it('the cart saved on the server (no items passed in) is judged the same way', async () => {
    const { verifyCoupon } = await import('@/app/(frontend)/(shop)/actions')
    const { user } = await login()
    await payload.create({ collection: 'carts', overrideAccess: true, data: { user: user.id, items: [{ product: store.product.id, variantSku: 'DEFAULT', quantity: 2, priceSnapshot: 17, planMonths: 6 }] } as any })
    expect(await verifyCoupon('PLAIN10', 34)).toMatchObject({ valid: false, error: NOT_ALLOWED })
    expect(await verifyCoupon('SUBALL10', 34)).toMatchObject({ valid: true, subscriptionScope: 'every_month' })
  })
})

describe('checkout (the server is the final judge)', () => {
  it('a normal coupon on a subscription is refused: no order, no subscription, nobody charged', async () => {
    await makeCoupon({ code: 'PLAIN-CHECKOUT' })
    const before = await countOrders()
    const subsBefore = (await payload.count({ collection: 'subscriptions', overrideAccess: true })).totalDocs
    const { res } = await subscribeWith('PLAIN-CHECKOUT')
    expect(res.error).toBe(NOT_ALLOWED)
    expect(await countOrders()).toBe(before)
    expect((await payload.count({ collection: 'subscriptions', overrideAccess: true })).totalDocs).toBe(subsBefore)
  })

  it('the same coupon on a normal one-time order still works', async () => {
    await makeCoupon({ code: 'PLAIN-ONETIME' })
    const { user, email } = await login()
    const { createPayloadOrder } = await import('@/app/(frontend)/(shop)/checkout/actions')
    const res: any = await createPayloadOrder([lineFor(store.product, null, 1)], 'Standard Shipping', 'PLAIN-ONETIME', false, { ...FORM, email }, 'manual', undefined, 'zelle')
    expect(res.error).toBeUndefined()
    const order = await getOrder(res.orderId)
    expect(order.discountTotal).toBeCloseTo(2, 2) // 10% of $20
    expect(order.orderType).toBe('one_time')
    void user
  })

  it('a coupon switched OFF for subscriptions after the customer saw it is refused at the end, instead of silently charging more', async () => {
    const c = await makeCoupon({ code: 'WAS-ON', allowOnSubscriptions: true })
    await payload.update({ collection: 'coupons', id: c.id, data: { allowOnSubscriptions: false } as any, overrideAccess: true })
    const { res } = await subscribeWith('WAS-ON')
    expect(res.error).toBe(NOT_ALLOWED)
  })
})

describe('"first order only" coupons', () => {
  it('discount the first payment; later invoices are at the normal plan price and no coupon is remembered', async () => {
    await makeCoupon({ code: 'FIRST-ONLY', allowOnSubscriptions: true, subscriptionDiscountScope: 'first_month' })
    const { res } = await subscribeWith('FIRST-ONLY')
    expect(res.error).toBeUndefined()
    const first = await getOrder(res.orderId)
    expect(first).toMatchObject({ couponCode: 'FIRST-ONLY', orderType: 'subscription_first' })
    expect(first.discountTotal).toBeCloseTo(3, 2) // 10% of 2 x $17 = 3.40, which the shop's coupon rule rounds DOWN to whole dollars
    expect(first.total).toBeCloseTo(34 - 3 + 5, 2)
    const sub = await getSub(first.subscription)
    expect(sub.recurringCouponCode ?? null).toBeNull()

    const [order2] = await runOrders(sub.id, first.id, 2)
    expect(order2.discountTotal).toBe(0)
    expect(order2.couponCode || '').toBe('')
    expect(order2.total).toBeCloseTo(34 + 5, 2)
  })
})

describe('"every order" coupons', () => {
  it('discount every invoice, however many there are (on top of the plan discount); the code is remembered on the subscription; it counts as ONE use', async () => {
    await makeCoupon({ code: 'EVERY-10', allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' })
    const { res } = await subscribeWith('EVERY-10')
    const first = await getOrder(res.orderId)
    expect(first.discountTotal).toBeCloseTo(3, 2)
    const sub = await getSub(first.subscription)
    expect(sub.recurringCouponCode).toBe('EVERY-10')

    // a subscription has no last order: six in a row all keep the discount
    const later = await runOrders(sub.id, first.id, 6)
    expect(later).toHaveLength(5)
    for (const inv of later) {
      expect(inv.couponCode).toBe('EVERY-10')
      expect(inv.discountTotal).toBeCloseTo(3, 2)
      expect(inv.subtotal).toBeCloseTo(34, 2) // plan price, before the coupon
      expect(inv.total).toBeCloseTo(34 - 3 + 5, 2)
      expect(inv.subscriptionDiscountPercent).toBe(15) // the plan discount is still there too
    }
    expect((await getCoupon('EVERY-10')).usageCount).toBe(1) // six payments, one use
  })

  it('a fixed amount every order ($5 off each invoice)', async () => {
    await makeCoupon({ code: 'FIVE-EVERY', type: 'fixed_amount', value: 500, allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' })
    const { res } = await subscribeWith('FIVE-EVERY')
    const first = await getOrder(res.orderId)
    expect(first.discountTotal).toBeCloseTo(5, 2)
    const [m2] = await runOrders(first.subscription, first.id, 2)
    expect(m2.discountTotal).toBeCloseTo(5, 2)
    expect(m2.total).toBeCloseTo(34 - 5 + 5, 2)
  })

  it('free shipping every order', async () => {
    await makeCoupon({ code: 'SHIP-EVERY', type: 'free_shipping', freeShipping: true, allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' })
    const { res } = await subscribeWith('SHIP-EVERY')
    const first = await getOrder(res.orderId)
    expect(first.shippingTotal).toBe(0)
    const [m2] = await runOrders(first.subscription, first.id, 2)
    expect(m2.shippingTotal).toBe(0)
    expect(m2.total).toBeCloseTo(34, 2)
  })

  it('keeps discounting after the coupon expires or reaches its usage limit (the customer was promised it when they subscribed)', async () => {
    const c = await makeCoupon({ code: 'PROMISED', allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month', usageLimit: 1 })
    const { res } = await subscribeWith('PROMISED')
    const first = await getOrder(res.orderId)
    expect((await getCoupon('PROMISED')).usageCount).toBe(1) // limit reached by this very order
    await payload.db.pool.query(`update coupons set expires_at = $1 where id = $2`, [new Date(Date.now() - 86400000).toISOString(), c.id]) // expired yesterday
    const [m2] = await runOrders(first.subscription, first.id, 2)
    expect(m2.discountTotal).toBeCloseTo(3, 2)
    // ... but nobody NEW can use it any more
    const { verifyCoupon } = await import('@/app/(frontend)/(shop)/actions')
    expect(await verifyCoupon('PROMISED', 34, [lineFor(store.product, 6, 2)])).toMatchObject({ valid: false })
  })

  it('stops when staff switch the coupon off for subscriptions, change it to first-order-only, or delete it - invoices still go out, just without the discount', async () => {
    const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
    const make = async (code: string) => {
      const c = await makeCoupon({ code, allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' })
      const { res } = await subscribeWith(code)
      const first = await getOrder(res.orderId)
      await pay(first.id)
      return { c, subId: first.subscription as number }
    }
    const invoiceOf = async (subId: any) => {
      const r: any = await orderNextMonthNow(payload, subId)
      expect(r.ok).toBe(true)
      return getOrder(r.orderId)
    }

    const off = await make('STOP-OFF')
    await payload.update({ collection: 'coupons', id: off.c.id, data: { allowOnSubscriptions: false } as any, overrideAccess: true })
    const invOff = await invoiceOf(off.subId)
    expect(invOff.discountTotal).toBe(0)
    expect(invOff.total).toBeCloseTo(39, 2)

    const scope = await make('STOP-SCOPE')
    await payload.update({ collection: 'coupons', id: scope.c.id, data: { subscriptionDiscountScope: 'first_month' } as any, overrideAccess: true })
    expect((await invoiceOf(scope.subId)).discountTotal).toBe(0)

    const del = await make('STOP-DELETE')
    await payload.delete({ collection: 'coupons', id: del.c.id, overrideAccess: true })
    const invDel = await invoiceOf(del.subId)
    expect(invDel.discountTotal).toBe(0)
    expect(invDel.total).toBeCloseTo(39, 2)
  })

  it('staff can clear the remembered coupon on a subscription to stop the discount for later invoices', async () => {
    await makeCoupon({ code: 'CLEAR-ME', allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' })
    const { res } = await subscribeWith('CLEAR-ME')
    const first = await getOrder(res.orderId)
    await pay(first.id)
    await payload.update({ collection: 'subscriptions', id: first.subscription, data: { recurringCouponCode: '' } as any, overrideAccess: true })
    const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
    const r: any = await orderNextMonthNow(payload, first.subscription)
    expect((await getOrder(r.orderId)).discountTotal).toBe(0)
  })

  it('a pause and resume does not lose the coupon', async () => {
    await makeCoupon({ code: 'PAUSE-KEEP', allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' })
    const { res } = await subscribeWith('PAUSE-KEEP')
    const first = await getOrder(res.orderId)
    await pay(first.id)
    const { pauseSubscription, resumeSubscription } = await import('@/lib/subscriptions/service')
    await pauseSubscription(payload, first.subscription)
    const resumeAt = new Date(Date.now() + 250 * 86400000) // long pause (past the 6-month interval): the invoice goes out on resume
    const r: any = await resumeSubscription(payload, first.subscription, resumeAt)
    expect(r.orderId).toBeTruthy()
    const inv = await getOrder(r.orderId)
    expect(inv.couponCode).toBe('PAUSE-KEEP')
    expect(inv.discountTotal).toBeCloseTo(3, 2)
  })
})
