import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import crypto from 'crypto'
import { createTestDatabase, bootPayload, seedStore, makeCustomer, lineFor, FORM, stockOf, shutdown } from './helpers'

const h = vi.hoisted(() => ({ session: '' as string, user: null as any, jar: new Map<string, string>(), headers: {} as Record<string, string> }))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (n: string) => (h.jar.has(n) ? { value: h.jar.get(n) } : undefined),
    set: (n: string, v: string) => void h.jar.set(n, v),
  }),
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
const emailsTo = (to: string) => sent.filter((m) => m.to === to)

async function bridgeWebhook(event: Record<string, unknown>) {
  const body = JSON.stringify(event)
  h.headers = { 'x-longevia-signature': crypto.createHmac('sha256', process.env.CROSS_SITE_PAYMENT_SECRET!).update(body).digest('hex') }
  const { POST } = await import('@/app/(frontend)/api/webhooks/cross-site-payment/route')
  return POST(new Request('http://x/api/webhooks/cross-site-payment', { method: 'POST', body }))
}

describe('subscription lifecycle - Zelle first month, monthly invoices, card payment, completion', () => {
  const ctx: any = {}

  it('checkout: a 3-month plan creates the first-month order and a pending subscription', async () => {
    const { user, email } = await makeCustomer(payload)
    Object.assign(ctx, { user, email })
    h.session = email
    h.user = user
    const { createPayloadOrder } = await import('@/app/(frontend)/(shop)/checkout/actions')
    const stockBefore = await stockOf(payload, store.product.id)

    const res: any = await createPayloadOrder(
      [lineFor(store.product, 3, 2)],
      'Standard Shipping',
      undefined,
      false,
      { ...FORM, email, acceptSubscriptionTerms: true },
      'manual',
      undefined,
      'zelle',
    )
    expect(res.error).toBeUndefined()
    const order = await getOrder(res.orderId)
    ctx.firstOrderId = order.id

    expect(order).toMatchObject({ orderType: 'subscription_first', cycleNumber: 1, cyclesTotal: 3, subscriptionDiscountPercent: 15, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'zelle' })
    expect(order.items[0]).toMatchObject({ quantity: 2, price: 17 }) // $20 less 15%
    expect(order.total).toBe(39) // 2 x $17 + $5 shipping
    expect(await stockOf(payload, store.product.id)).toBe(stockBefore - 2) // reserved, like any Zelle order

    const sub = await getSub(order.subscription)
    ctx.subId = sub.id
    expect(sub).toMatchObject({ status: 'pending_payment', planMonths: 3, discountPercent: 15, paymentMethod: 'zelle', cyclesCompleted: 0, shippingMethod: 'Standard Shipping' })
    expect(sub.owner).toBe(user.id)
    expect(sub.firstOrder).toBe(order.id)
    expect(sub.items[0]).toMatchObject({ quantity: 2, variantSku: 'DEFAULT' })
    expect(sub.shippingAddress).toMatchObject({ line1: '1 Main St', city: 'New York', postalCode: '10001' })

    const mail = emailsTo(email).find((m) => m.subject.startsWith('Subscription Order Confirmation'))
    expect(mail?.subject).toBe(`Subscription Order Confirmation #${order.orderNumber} - Month 1 of 3`)
    expect(mail?.html).toContain('Subscription &middot; Month 1 of 3')
    expect(mail?.html).toContain('Zelle') // unpaid: payment instructions
  })

  it('admin marks the Zelle payment paid -> subscription activates and the next invoice is scheduled', async () => {
    const paid: any = await payload.update({ collection: 'orders', id: ctx.firstOrderId, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })
    const sub = await getSub(ctx.subId)

    expect(sub.status).toBe('active')
    expect(sub.cyclesCompleted).toBe(1)
    expect(sub.startedAt).toBeTruthy()
    const due = new Date(sub.nextDueDate)
    const paidAt = new Date(paid.paidAt)
    const expected = new Date(paidAt)
    expected.setUTCMonth(expected.getUTCMonth() + 1)
    expect(Math.abs(due.getTime() - expected.getTime())).toBeLessThan(3 * 24 * 3600 * 1000) // one month after payment (month-end clamping tolerance)
    expect(new Date(sub.nextInvoiceDate).getTime()).toBe(due.getTime() - 7 * 24 * 3600 * 1000)

    const receipt = emailsTo(ctx.email).find((m) => m.subject.startsWith('Payment received'))
    expect(receipt?.subject).toMatch(/Month 1 of 3/)
  })

  it('daily job: creates the month-2 invoice at the LIVE price (-15%), reserves stock, emails the pay link; running again does nothing', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    await payload.update({ collection: 'products', id: store.product.id, data: { price: 24 } as any, overrideAccess: true }) // price rose: invoice must follow
    const sub = await getSub(ctx.subId)
    const stockBefore = await stockOf(payload, store.product.id)

    const run1 = await processSubscriptions(payload, new Date(sub.nextInvoiceDate))
    expect(run1).toMatchObject({ invoicesCreated: 1, errors: 0 })

    const after = await getSub(ctx.subId)
    expect(after.openInvoice).toBeTruthy()
    const inv = await getOrder(after.openInvoice)
    ctx.invoiceId = inv.id
    expect(inv).toMatchObject({ orderType: 'subscription_cycle', cycleNumber: 2, cyclesTotal: 3, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'zelle', subscriptionDiscountPercent: 15 })
    expect(inv.items[0].price).toBe(20.4) // $24 less 15%
    expect(inv.total).toBe(45.8) // 2 x 20.40 + $5
    expect(new Date(inv.invoiceDueDate).getTime()).toBe(new Date(sub.nextDueDate).getTime())
    expect(inv.invoiceToken).toMatch(/^[A-Za-z0-9_-]{30,}$/)
    expect(inv.isFinalized).toBe(true) // stock reserved
    expect(await stockOf(payload, store.product.id)).toBe(stockBefore - 2)

    const mail = emailsTo(ctx.email).find((m) => m.subject.startsWith('Subscription invoice'))
    expect(mail?.subject).toContain(`#${inv.orderNumber} - Month 2 of 3`)
    expect(mail?.html).toContain(`/pay/${inv.id}/${inv.invoiceToken}`)
    expect(mail?.html).toContain('$45.80')
    expect(mail?.html).toContain('Zelle QR Code') // Zelle subscriber

    const run2 = await processSubscriptions(payload, new Date(sub.nextInvoiceDate))
    expect(run2.invoicesCreated).toBe(0) // idempotent: one open invoice per month
    const all = await payload.find({ collection: 'orders', where: { subscription: { equals: ctx.subId } }, depth: 0, overrideAccess: true })
    expect(all.totalDocs).toBe(2)
  })

  it('the customer pays that invoice by CARD (Zelle subscriber, one-off): webhook marks it paid, cart is NOT emptied, receipt sent', async () => {
    // the customer is shopping at the same time
    await payload.create({
      collection: 'carts',
      overrideAccess: true,
      data: { user: ctx.user.id, items: [{ product: store.product2.id, variantSku: 'DEFAULT', quantity: 1, priceSnapshot: 30 }] } as any,
    })
    const inv = await getOrder(ctx.invoiceId)

    const res = await bridgeWebhook({ orderId: String(inv.id), amountCents: Math.round(inv.total * 100), status: 'succeeded', txnId: 'TXN-200', affiliateId: null, clickId: null })
    expect(res.status).toBe(200)

    const paid = await getOrder(inv.id)
    expect(paid).toMatchObject({ status: 'paid', paymentStatus: 'captured', paymentMethod: 'authnet_bridge', paymentTxnId: 'TXN-200' })
    const sub = await getSub(ctx.subId)
    expect(sub).toMatchObject({ cyclesCompleted: 2, status: 'active' })
    expect(sub.openInvoice).toBeNull()
    expect(sub.paymentMethod).toBe('zelle') // their default is unchanged

    const cart: any = (await payload.find({ collection: 'carts', where: { user: { equals: ctx.user.id } }, depth: 0, overrideAccess: true })).docs[0]
    expect(cart.items).toHaveLength(1) // a monthly payment must not wipe what they are shopping with

    const receipt = emailsTo(ctx.email).filter((m) => m.subject.startsWith('Payment received'))
    expect(receipt.map((m) => m.subject).some((s) => /Month 2 of 3/.test(s))).toBe(true)
  })

  it('the same payment delivered again is a harmless no-op; a DIFFERENT transaction raises a duplicate alert to support', async () => {
    const inv = await getOrder(ctx.invoiceId)
    const before = sent.length
    const again = await bridgeWebhook({ orderId: String(inv.id), amountCents: Math.round(inv.total * 100), status: 'succeeded', txnId: 'TXN-200' })
    expect(again.status).toBe(200)
    expect(sent.length).toBe(before) // no extra email

    const dup = await bridgeWebhook({ orderId: String(inv.id), amountCents: Math.round(inv.total * 100), status: 'succeeded', txnId: 'TXN-999' })
    expect(dup.status).toBe(200)
    const alert = sent.slice(before).find((m) => m.to === 'support@longeviaresearch.com' && /Duplicate card payment/.test(m.subject))
    expect(alert).toBeTruthy()
    expect((await getSub(ctx.subId)).cyclesCompleted).toBe(2) // still just two months paid
  })

  it('month 3: invoice, Zelle payment by admin, and the plan completes - then no more invoices ever', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const sub = await getSub(ctx.subId)
    const run = await processSubscriptions(payload, new Date(sub.nextInvoiceDate))
    expect(run.invoicesCreated).toBe(1)
    const inv3 = await getOrder((await getSub(ctx.subId)).openInvoice)
    expect(inv3.cycleNumber).toBe(3)

    await payload.update({ collection: 'orders', id: inv3.id, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })
    const done = await getSub(ctx.subId)
    expect(done).toMatchObject({ status: 'completed', cyclesCompleted: 3 })
    expect(done.nextDueDate).toBeNull()
    expect(done.nextInvoiceDate).toBeNull()
    expect(done.openInvoice).toBeNull()

    const far = new Date(Date.now() + 400 * 24 * 3600 * 1000)
    const later = await processSubscriptions(payload, far)
    expect(later).toMatchObject({ invoicesCreated: 0, lapsed: 0, errors: 0 })
    const all = await payload.find({ collection: 'orders', where: { subscription: { equals: ctx.subId } }, depth: 0, overrideAccess: true })
    expect(all.totalDocs).toBe(3) // exactly one order per month
  })
})
