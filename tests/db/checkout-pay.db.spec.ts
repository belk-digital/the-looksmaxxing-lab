import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import crypto from 'crypto'
import { createTestDatabase, bootPayload, seedStore, makeCustomer, lineFor, startActiveSubscription, FORM, stockOf, shutdown } from './helpers'

const h = vi.hoisted(() => ({ session: '' as string, user: null as any, jar: new Map<string, string>(), headers: {} as Record<string, string> }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (n: string) => (h.jar.has(n) ? { value: h.jar.get(n) } : undefined), set: (n: string, v: string) => void h.jar.set(n, v) }),
  headers: async () => new Headers(h.headers),
}))
vi.mock('next-auth/next', () => ({ getServerSession: async () => (h.session ? { user: { email: h.session } } : null) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/auth/getPayloadUser', () => ({ getPayloadUser: async () => h.user }))

let db: Awaited<ReturnType<typeof createTestDatabase>>
let payload: any
let sent: { to?: string; bcc?: string; subject: string; html: string }[]
let store: { product: any; product2: any }

const setUser = (user: any, email: string) => {
  h.user = user
  h.session = email
}
const env = () => ({ payload, store, setUser })

beforeAll(async () => {
  db = await createTestDatabase()
  ;({ payload, sent } = await bootPayload(db.uri))
  store = await seedStore(payload)
})
afterAll(async () => {
  await shutdown(payload, db)
})

const getSub = (id: any) => payload.findByID({ collection: 'subscriptions', id, depth: 0, overrideAccess: true }) as Promise<any>
const getOrder = (id: any) => payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true }) as Promise<any>
const markPaid = (id: any) => payload.update({ collection: 'orders', id, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })

async function checkout(opts: { items: any[]; method?: 'zelle' | 'authnet_bridge' | 'stripe'; intent?: string; coupon?: string; terms?: boolean; loggedIn?: boolean; customer?: { user: any; email: string } }) {
  const { createPayloadOrder } = await import('@/app/(frontend)/(shop)/checkout/actions')
  const c = opts.customer ?? (await makeCustomer(payload))
  if (opts.loggedIn === false) {
    h.session = ''
    h.user = null
  } else setUser(c.user, c.email)
  const method = opts.method ?? 'zelle'
  return createPayloadOrder(
    opts.items,
    'Standard Shipping',
    opts.coupon,
    false,
    { ...FORM, email: c.email, acceptSubscriptionTerms: opts.terms !== false },
    opts.intent ?? (method === 'zelle' ? 'manual' : method === 'authnet_bridge' ? 'authnet_bridge' : 'pi_fake'),
    undefined,
    method,
  ) as Promise<any>
}

describe('checkout rules for subscription plans', () => {
  it('needs an account: a guest cannot start a subscription, but a guest can still place a normal one-time order', async () => {
    const guest = await checkout({ items: [lineFor(store.product, 3)], loggedIn: false })
    expect(guest.error).toMatch(/log in or create an account/i)
    expect(guest.orderId).toBeUndefined()

    const before = await stockOf(payload, store.product.id)
    const oneTime = await checkout({ items: [lineFor(store.product, null, 1)], loggedIn: false })
    expect(oneTime.error).toBeUndefined()
    const order = await getOrder(oneTime.orderId)
    expect(order).toMatchObject({ orderType: 'one_time', status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'zelle', total: 25 })
    expect(order.subscription).toBeNull()
    expect(await stockOf(payload, store.product.id)).toBe(before - 1)
  })

  it('needs the terms ticked', async () => {
    const res = await checkout({ items: [lineFor(store.product, 3)], terms: false })
    expect(res.error).toMatch(/accept the subscription terms/i)
  })

  it('cannot be paid with Stripe', async () => {
    expect((await checkout({ items: [lineFor(store.product, 3)], method: 'stripe' })).error).toMatch(/card \(Authorize\.net\) or Zelle/i)
    const { createPaymentIntent } = await import('@/app/(frontend)/(shop)/checkout/actions')
    const pi: any = await createPaymentIntent([lineFor(store.product, 3)], 'Standard Shipping', undefined, false)
    expect(pi.error).toMatch(/card \(Authorize\.net\) or Zelle/i)
  })

  it('respects the admin: payment methods allowed for plans, the master switch, and per-product eligibility', async () => {
    await payload.updateGlobal({ slug: 'subscription-settings', data: { allowZelle: false } as any })
    expect((await checkout({ items: [lineFor(store.product, 3)], method: 'zelle' })).error).toMatch(/not available for subscriptions/i)
    await payload.updateGlobal({ slug: 'subscription-settings', data: { allowZelle: true } as any })

    await payload.updateGlobal({ slug: 'subscription-settings', data: { enabled: false } as any })
    expect((await checkout({ items: [lineFor(store.product, 3)] })).error).toMatch(/not available right now/i)
    await payload.updateGlobal({ slug: 'subscription-settings', data: { enabled: true } as any })

    // TB-500 is not flagged as subscribable
    expect((await checkout({ items: [lineFor(store.product2, 3, 1, 25.5)] })).error).toMatch(/not available as a subscription/i)

    // a plan length that doesn't exist
    expect((await checkout({ items: [lineFor(store.product, 5)] })).error).toMatch(/no longer available/i)
  })

  it('a plan cart cannot be mixed with one-time items or different plan lengths', async () => {
    expect((await checkout({ items: [lineFor(store.product, 3), lineFor(store.product2, null, 1)] })).error).toMatch(/on its own/i)
    expect((await checkout({ items: [lineFor(store.product, 3), lineFor(store.product, 6)] })).error).toMatch(/same plan length/i)
  })

  it('refuses a bulk-bundle SKU, and a client that sends the wrong (undiscounted) price is shown the real one', async () => {
    const bundled: any = await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: { name: 'Bundle Pep', slug: 'bundle-pep', price: 10, stock: 50, status: 'active', isVisible: true, subscriptionEnabled: true, bulkBundles: [{ name: 'Kit of 5', quantity: 5, discountPercentage: 10 }] } as any,
    })
    const bundleLine = { ...lineFor(bundled, 3, 1), variantSku: '10mg - Kit of 5' }
    expect((await checkout({ items: [bundleLine] })).error).toMatch(/bulk bundles cannot be subscribed/i)

    const wrongPrice: any = await checkout({ items: [lineFor(store.product, 3, 2, 20)] }) // undiscounted $20 instead of $16 (3-month plan = 20% off)
    expect(wrongPrice.priceChanged).toBe(true)
    expect(wrongPrice.updatedItems[0].priceSnapshot).toBe(16)
  })

  it.each([
    [1, 25, 15],
    [3, 20, 16],
    [6, 15, 17],
  ])('a plan of %i month(s) stores its interval and its locked-in %i%% discount; order 1 is priced from the live price (%i per unit)', async (months, percent, unit) => {
    const res = await checkout({ items: [lineFor(store.product, months, 1)] })
    expect(res.error).toBeUndefined()
    const order = await getOrder(res.orderId)
    // there is no "number of orders": a subscription has no end, so nothing is stored about a total
    expect(order).toMatchObject({ orderType: 'subscription_first', cycleNumber: 1, cyclesTotal: null, subscriptionDiscountPercent: percent })
    expect(order.items[0].price).toBe(unit)
    expect(order.total).toBe(unit + 5)
    const sub = await getSub(order.subscription)
    expect(sub).toMatchObject({ planMonths: months, discountPercent: percent, status: 'pending_payment' })
  })

  it('the old 12-month plan no longer exists', async () => {
    const res = await checkout({ items: [lineFor(store.product, 12, 1)] })
    expect(res.error).toMatch(/no longer available/i)
  })

  it('a coupon switched on for subscriptions (first order only) applies to the FIRST order only; later orders are plain plan price', async () => {
    await payload.create({ collection: 'coupons', overrideAccess: true, data: { code: 'SAVE10', type: 'percentage', value: 10, applicableProductTypes: 'all', appliesTo: 'all', allowOnSubscriptions: true, subscriptionDiscountScope: 'first_month' } as any })
    const s = await startActiveSubscription(env(), { couponCode: 'SAVE10' })
    const first = await getOrder(s.firstOrderId)
    expect(first.couponCode).toBe('SAVE10')
    expect(first.discountTotal).toBe(3) // floor(10% of $32)
    expect(first.total).toBe(34) // 32 - 3 + 5

    const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
    const res: any = await orderNextMonthNow(payload, s.subId)
    const invoice = await getOrder(res.orderId)
    expect(invoice.couponCode).toBeFalsy()
    expect(invoice.discountTotal).toBe(0)
    expect(invoice.total).toBe(37) // 2 x $16 + $5, no coupon
  })

  it('fees and shipping follow the same rules as a one-time order (a processing fee is added to every order)', async () => {
    await payload.create({ collection: 'processing-fees', overrideAccess: true, data: { name: 'Card fee', type: 'percentage', amount: 3, isActive: true, isOptional: false } as any })
    const s = await startActiveSubscription(env())
    const first = await getOrder(s.firstOrderId)
    expect(first.feeTotal).toBe(96) // cents: 3% of $32
    expect(first.total).toBeCloseTo(32 + 5 + 0.96, 2)
    const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
    const inv = await getOrder(((await orderNextMonthNow(payload, s.subId)) as any).orderId)
    expect(inv.feeTotal).toBe(96)
    expect(inv.appliedFees).toHaveLength(1)
    expect(inv.total).toBeCloseTo(37.96, 2)
    const fees = await payload.find({ collection: 'processing-fees', overrideAccess: true })
    for (const f of fees.docs) await payload.delete({ collection: 'processing-fees', id: f.id, overrideAccess: true })
  })

  it('a free first order (fully covered) starts the subscription immediately', async () => {
    const zone: any = (await payload.find({ collection: 'shippingzones', limit: 1, overrideAccess: true })).docs[0]
    await payload.update({ collection: 'shippingzones', id: zone.id, data: { methods: [...zone.methods, { method: 'Free Shipping', price: 0 }] } as any, overrideAccess: true })
    const free: any = await payload.create({ collection: 'products', overrideAccess: true, data: { name: 'Sample', slug: 'sample', price: 0, stock: 20, status: 'active', isVisible: true, subscriptionEnabled: true } as any })
    const { createPayloadOrder } = await import('@/app/(frontend)/(shop)/checkout/actions')
    const { user, email } = await makeCustomer(payload)
    setUser(user, email)
    const res: any = await createPayloadOrder([lineFor(free, 3, 1, 0)], 'Free Shipping', undefined, false, { ...FORM, email, acceptSubscriptionTerms: true }, 'free_order')
    expect(res.error).toBeUndefined()
    const order = await getOrder(res.orderId)
    expect(order).toMatchObject({ status: 'paid', paymentStatus: 'captured', orderType: 'subscription_first' })
    const sub = await getSub(order.subscription)
    expect(sub).toMatchObject({ status: 'active', cyclesCompleted: 1 })
    expect(sub.nextInvoiceDate).toBeTruthy()
  })
})

describe('first order by card (Authorize.net bridge)', () => {
  it('order waits unpaid; the signed hand-off is only given to its owner; the webhook then activates the plan', async () => {
    const { createCrossSitePaymentRedirect } = await import('@/app/(frontend)/(shop)/checkout/actions')
    const customer = await makeCustomer(payload)
    // the customer has items in their cart (a normal checkout empties it once paid)
    await payload.create({ collection: 'carts', overrideAccess: true, data: { user: customer.user.id, items: [{ product: store.product.id, variantSku: 'DEFAULT', quantity: 2, priceSnapshot: 16, planMonths: 3 }] } as any })
    const stock = await stockOf(payload, store.product.id)

    const res = await checkout({ items: [lineFor(store.product, 3)], method: 'authnet_bridge', customer })
    expect(res.error).toBeUndefined()
    const order = await getOrder(res.orderId)
    expect(order).toMatchObject({ orderType: 'subscription_first', status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'authnet_bridge', total: 37, isFinalized: false })
    expect(await stockOf(payload, store.product.id)).toBe(stock) // not reserved until paid
    expect((await getSub(order.subscription)).status).toBe('pending_payment')

    // hand-off: same signed payload the WordPress plugin verifies
    const handoff: any = await createCrossSitePaymentRedirect(String(order.id))
    expect(handoff.error).toBeUndefined()
    const decoded = JSON.parse(Buffer.from(handoff.fields.payload, 'base64url').toString())
    expect(decoded).toMatchObject({ orderId: String(order.id), amountCents: 3700, currency: 'usd', email: customer.email })
    expect(handoff.fields.sig).toBe(crypto.createHmac('sha256', process.env.CROSS_SITE_PAYMENT_SECRET!).update(handoff.fields.payload).digest('hex'))

    // someone else (no cookie, not the owner) gets nothing
    const savedJar = new Map(h.jar)
    h.jar.clear()
    const other = await makeCustomer(payload)
    setUser(other.user, other.email)
    expect(((await createCrossSitePaymentRedirect(String(order.id))) as any).error).toBeTruthy()
    h.jar = savedJar as any
    h.jar.forEach((v, k) => h.jar.set(k, v))
    setUser(customer.user, customer.email)

    // WordPress confirms the card payment
    const body = JSON.stringify({ orderId: String(order.id), amountCents: 3700, status: 'succeeded', txnId: 'FIRST-1', affiliateId: null, clickId: null })
    h.headers = { 'x-longevia-signature': crypto.createHmac('sha256', process.env.CROSS_SITE_PAYMENT_SECRET!).update(body).digest('hex') }
    const { POST } = await import('@/app/(frontend)/api/webhooks/cross-site-payment/route')
    const resp = await POST(new Request('http://x/api/webhooks/cross-site-payment', { method: 'POST', body }))
    expect(resp.status).toBe(200)

    const paid = await getOrder(order.id)
    expect(paid).toMatchObject({ status: 'paid', paymentStatus: 'captured', isFinalized: true, paymentTxnId: 'FIRST-1' })
    expect(await stockOf(payload, store.product.id)).toBe(stock - 2)
    expect(await getSub(order.subscription)).toMatchObject({ status: 'active', cyclesCompleted: 1 })
    const cart: any = (await payload.find({ collection: 'carts', where: { user: { equals: customer.user.id } }, depth: 0, overrideAccess: true })).docs[0]
    expect(cart.items).toHaveLength(0) // a normal checkout empties the cart that was just bought
    const mail = sent.filter((m) => m.to === customer.email).find((m) => /Subscription Order Confirmation/.test(m.subject))
    expect(mail?.subject).toBe(`Subscription Order Confirmation #${order.orderNumber} - First order`)
    expect(mail?.html).toContain('Subscription &middot; Order 1')
  })
})

describe('the emailed pay page', () => {
  async function invoiceFor(method: 'zelle' | 'authnet_bridge' = 'zelle') {
    const s = await startActiveSubscription(env(), { method })
    const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
    const res: any = await orderNextMonthNow(payload, s.subId)
    const order = await getOrder(res.orderId)
    return { ...s, order }
  }

  it('shows only the invoice (no address, phone or customer email) and never indexes', async () => {
    const s = await invoiceFor()
    const mod = await import('@/app/(frontend)/(shop)/pay/[orderId]/[token]/page')
    const el: any = await mod.default({ params: Promise.resolve({ orderId: String(s.order.id), token: s.order.invoiceToken }), searchParams: Promise.resolve({}) })
    const inv = el.props.children.props.invoice
    expect(inv).toMatchObject({ state: 'open', order: 2, intervalMonths: 3, total: 37, paymentMethod: 'zelle', discountPercent: 20 })
    expect(inv).not.toHaveProperty('monthsTotal')
    expect(JSON.stringify(inv)).not.toMatch(/Main St|5551234567|10001|example\.com/)
    expect((mod as any).metadata.robots).toEqual({ index: false, follow: false })

    const back: any = await mod.default({ params: Promise.resolve({ orderId: String(s.order.id), token: s.order.invoiceToken }), searchParams: Promise.resolve({ returned: '1' }) })
    expect(back.props.children.props.invoice.returnedFromPayment).toBe(true)
  })

  it('a wrong or guessed link is indistinguishable from a missing page', async () => {
    const s = await invoiceFor()
    const mod = await import('@/app/(frontend)/(shop)/pay/[orderId]/[token]/page')
    const notFound = async (orderId: string, token: string) => {
      try {
        await mod.default({ params: Promise.resolve({ orderId, token }), searchParams: Promise.resolve({}) })
        return false
      } catch (e: any) {
        return /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/.test(String(e?.digest || e?.message))
      }
    }
    expect(await notFound(String(s.order.id), 'wrong-token-wrong-token-wrong')).toBe(true)
    expect(await notFound(String(s.order.id), 'short')).toBe(true)
    expect(await notFound(String(s.order.id + 1), s.order.invoiceToken)).toBe(true) // right token, someone else's order
    expect(await notFound('abc', s.order.invoiceToken)).toBe(true)
    expect(await notFound(String(s.firstOrderId), s.order.invoiceToken)).toBe(true) // the first order isn't payable here
    expect(await notFound(String(s.order.id), s.order.invoiceToken)).toBe(false) // the real one works
  })

  it('"Pay by card" produces a signed hand-off that returns to THIS page; a Zelle invoice is switched to card', async () => {
    const s = await invoiceFor('zelle')
    const { startInvoiceCardPayment } = await import('@/app/(frontend)/(shop)/pay/actions')
    const res: any = await startInvoiceCardPayment(String(s.order.id), s.order.invoiceToken)
    expect(res.error).toBeUndefined()
    expect(res.redirectUrl).toBe(process.env.LONGEVIA_BEAUTY_BRIDGE_URL)
    const decoded = JSON.parse(Buffer.from(res.fields.payload, 'base64url').toString())
    expect(decoded).toMatchObject({ orderId: String(s.order.id), amountCents: 3700, currency: 'usd', orderNumber: s.order.orderNumber })
    expect(decoded.returnUrl).toBe(`${process.env.NEXT_PUBLIC_SERVER_URL}/pay/${s.order.id}/${s.order.invoiceToken}?returned=1`)
    expect(decoded.cancelUrl).toBe(`${process.env.NEXT_PUBLIC_SERVER_URL}/pay/${s.order.id}/${s.order.invoiceToken}`)
    expect(Math.abs(Date.now() - decoded.ts)).toBeLessThan(10_000) // made at click time (WordPress rejects > 10 min)
    expect(res.fields.sig).toBe(crypto.createHmac('sha256', process.env.CROSS_SITE_PAYMENT_SECRET!).update(res.fields.payload).digest('hex'))
    expect((await getOrder(s.order.id)).paymentMethod).toBe('authnet_bridge')
    expect((await getSub(s.subId)).paymentMethod).toBe('zelle') // their default stays
    // every click is a fresh hand-off (new nonce)
    const again: any = await startInvoiceCardPayment(String(s.order.id), s.order.invoiceToken)
    expect(JSON.parse(Buffer.from(again.fields.payload, 'base64url').toString()).nonce).not.toBe(decoded.nonce)
  })

  it('refuses a wrong token, a paid invoice, a cancelled invoice, and an unconfigured bridge', async () => {
    const { startInvoiceCardPayment } = await import('@/app/(frontend)/(shop)/pay/actions')
    const s = await invoiceFor('authnet_bridge')
    expect(((await startInvoiceCardPayment(String(s.order.id), 'x'.repeat(30))) as any).error).toMatch(/not valid/i)

    const saved = process.env.LONGEVIA_BEAUTY_BRIDGE_URL
    process.env.LONGEVIA_BEAUTY_BRIDGE_URL = ''
    expect(((await startInvoiceCardPayment(String(s.order.id), s.order.invoiceToken)) as any).error).toMatch(/temporarily unavailable/i)
    process.env.LONGEVIA_BEAUTY_BRIDGE_URL = saved

    await markPaid(s.order.id)
    expect(((await startInvoiceCardPayment(String(s.order.id), s.order.invoiceToken)) as any).error).toMatch(/already paid/i)

    const t = await invoiceFor('authnet_bridge')
    const { skipNextMonth } = await import('@/lib/subscriptions/service')
    await skipNextMonth(payload, t.subId) // cancels the open invoice
    expect(((await startInvoiceCardPayment(String(t.order.id), t.order.invoiceToken)) as any).error).toMatch(/no longer active/i)

    const mod = await import('@/app/(frontend)/(shop)/pay/[orderId]/[token]/page')
    const el: any = await mod.default({ params: Promise.resolve({ orderId: String(t.order.id), token: t.order.invoiceToken }), searchParams: Promise.resolve({}) })
    expect(el.props.children.props.invoice.state).toBe('inactive')
    const paidEl: any = await mod.default({ params: Promise.resolve({ orderId: String(s.order.id), token: s.order.invoiceToken }), searchParams: Promise.resolve({}) })
    expect(paidEl.props.children.props.invoice.state).toBe('paid')
  })
})

describe('affiliate commission on every order', () => {
  it('the referring affiliate gets a (pending) commission for the first order and for each invoice; a cancelled invoice reverses its commission', async () => {
    const affUser = await makeCustomer(payload, 'aff')
    const affiliate: any = await payload.create({
      collection: 'affiliates',
      overrideAccess: true,
      data: { user: affUser.user.id, status: 'approved', referralSlug: 'ref-test', couponCode: 'AFFTEST', displayName: 'Aff' } as any,
    })
    h.jar.set('affiliate_ref', String(affiliate.id))
    const s = await startActiveSubscription(env())
    h.jar.delete('affiliate_ref')

    const sub = await getSub(s.subId)
    expect(sub.affiliate).toBe(affiliate.id)

    const conversions = async () =>
      (await payload.find({ collection: 'affiliate-conversions', where: { affiliate: { equals: affiliate.id } }, depth: 0, limit: 50, overrideAccess: true })).docs as any[]
    expect(await conversions()).toHaveLength(1) // order 1, from the referral cookie
    expect((await conversions())[0]).toMatchObject({ status: 'pending', order: s.firstOrderId })

    // order 2 invoice is created later with NO cookie anywhere - attribution comes from the subscription
    const { orderNextMonthNow, skipNextMonth } = await import('@/lib/subscriptions/service')
    const early: any = await orderNextMonthNow(payload, s.subId)
    const convs = await conversions()
    expect(convs).toHaveLength(2)
    const second = convs.find((c) => c.order === early.orderId)
    expect(second).toMatchObject({ status: 'pending' })
    expect(second.commissionAmount).toBeGreaterThan(0)

    // skipping cancels that unpaid invoice -> its commission is reversed
    await skipNextMonth(payload, s.subId)
    const after = (await conversions()).find((c) => c.order === early.orderId)
    expect(after.status).toBe('reversed')
    expect(after.reversedReason).toBe('order_cancelled')
  })
})
