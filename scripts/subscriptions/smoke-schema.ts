/**
 * Smoke test: boots Payload (schema push OFF, like production) against a migrated LOCAL database and
 * exercises the new collections/fields through the real Local API.
 * Run: LM_DB=lm_mig_test node scripts/subscriptions/local-env.cjs npx tsx scripts/subscriptions/smoke-schema.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const uri = process.env.DATABASE_URI || ''
if (!/@(127\.0\.0\.1|localhost)(:|\/)/.test(uri)) throw new Error('smoke test refuses to run against a non-local database')

const results: [string, boolean, string?][] = []
const check = (name: string, ok: boolean, detail?: string) => {
  results.push([name, ok, detail])
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  - ' + detail : ''}`)
}

const payload = await getPayload({ config })

try {
  // 1. existing data still readable through Payload with the new schema
  const orders = await payload.find({ collection: 'orders', limit: 100, depth: 0, overrideAccess: true })
  check('existing orders load', orders.totalDocs === 7, `${orders.totalDocs} orders`)
  check('existing orders are one_time', orders.docs.every((o: any) => o.orderType === 'one_time'))
  check('existing order fields intact', orders.docs.every((o: any) => o.total === 54.99 && o.shippingMethod === 'Standard Shipping'))

  // 2. settings global: defaults, then save
  const before: any = await payload.findGlobal({ slug: 'subscription-settings' as any })
  check('settings global readable before first save', !!before)
  const saved: any = await payload.updateGlobal({
    slug: 'subscription-settings' as any,
    data: { enabled: true, plans: [{ months: 1, label: 'Every month', discountPercent: 25, isActive: true }, { months: 3, label: 'Every 3 months', discountPercent: 20, isActive: true }, { months: 6, label: 'Every 6 months', discountPercent: 15, isActive: true }] } as any,
  })
  check('settings global saves 3 plans', saved.plans?.length === 3 && saved.enabled === true)
  const again: any = await payload.findGlobal({ slug: 'subscription-settings' as any })
  check('settings persisted', again.plans?.length === 3 && again.allowCard === true && again.invoiceLeadDays === 7)

  // 3. product flag
  const product: any = (await payload.find({ collection: 'products', limit: 1, depth: 0, overrideAccess: true })).docs[0]
  const flagged: any = await payload.update({ collection: 'products', id: product.id, data: { subscriptionEnabled: true } as any, overrideAccess: true })
  check('product subscriptionEnabled saves', flagged.subscriptionEnabled === true)

  // 4. subscription + items + virtual reference
  const user: any = (await payload.find({ collection: 'users', where: { email: { equals: 'alice@example.com' } }, limit: 1, overrideAccess: true })).docs[0]
  const sub: any = await payload.create({
    collection: 'subscriptions' as any,
    overrideAccess: true,
    data: {
      owner: user.id, planMonths: 3, discountPercent: 15, paymentMethod: 'zelle', shippingMethod: 'Standard Shipping',
      shippingAddress: { line1: '1 Main St', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US' },
      items: [{ product: product.id, variantSku: 'DEFAULT', quantity: 2 }],
    } as any,
  })
  check('subscription created with defaults', sub.status === 'pending_payment' && sub.cyclesCompleted === 0)
  const readSub: any = await payload.findByID({ collection: 'subscriptions' as any, id: sub.id, depth: 0, overrideAccess: true })
  check('virtual reference works', readSub.reference === `SUB-${sub.id}`, readSub.reference)
  check('subscription items persisted', readSub.items?.length === 1 && readSub.items[0].quantity === 2)

  // 5. orders with subscription fields
  const o1: any = await payload.create({
    collection: 'orders', overrideAccess: true,
    data: { owner: user.id, guestEmail: 'alice@example.com', status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'zelle', total: 10, orderType: 'subscription_cycle', subscription: sub.id, cycleNumber: 2, cyclesTotal: 3, invoiceToken: 'tok', invoiceDueDate: new Date().toISOString(), items: [{ product: product.id, quantity: 1, price: 10 }] } as any,
  })
  check('subscription order created', o1.orderType === 'subscription_cycle' && o1.cycleNumber === 2)
  const filtered = await payload.find({ collection: 'orders', where: { orderType: { equals: 'subscription_cycle' } }, depth: 0, overrideAccess: true })
  check('orders filterable by type', filtered.totalDocs === 1)

  // 6. duplicate open invoice for the same month is blocked by the database
  let blocked = false
  try {
    await payload.create({
      collection: 'orders', overrideAccess: true,
      data: { owner: user.id, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'zelle', total: 10, orderType: 'subscription_cycle', subscription: sub.id, cycleNumber: 2, cyclesTotal: 3, items: [{ product: product.id, quantity: 1, price: 10 }] } as any,
    })
  } catch {
    blocked = true
  }
  check('second open invoice for same month is rejected', blocked)

  // 7. paidAt is stamped when payment is captured
  const paid: any = await payload.update({ collection: 'orders', id: o1.id, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })
  check('paidAt stamped on capture', !!paid.paidAt)
  // ...and once the first is paid, a new open invoice for another month is fine
  const o3: any = await payload.create({
    collection: 'orders', overrideAccess: true,
    data: { owner: user.id, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'zelle', total: 10, orderType: 'subscription_cycle', subscription: sub.id, cycleNumber: 3, cyclesTotal: 3, items: [{ product: product.id, quantity: 1, price: 10 }] } as any,
  })
  check('next month invoice can be created', !!o3.id)

  // 8. cart plan line
  const cart: any = await payload.create({
    collection: 'carts', overrideAccess: true,
    data: { user: user.id, items: [{ product: product.id, variantSku: 'DEFAULT', quantity: 1, priceSnapshot: 42.49, planMonths: 6 }] } as any,
  })
  const readCart: any = await payload.findByID({ collection: 'carts', id: cart.id, depth: 0, overrideAccess: true })
  check('cart line keeps planMonths', readCart.items?.[0]?.planMonths === 6)

  // 9. cleanup test rows
  await payload.delete({ collection: 'carts', id: cart.id, overrideAccess: true })
} catch (err) {
  console.error('SMOKE TEST ERROR:', err)
  check('no unexpected error', false, (err as Error).message)
}

const failed = results.filter((r) => !r[1])
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
