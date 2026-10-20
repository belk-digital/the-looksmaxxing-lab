import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { loadInvoiceByToken } from '@/lib/subscriptions/invoices'
import { bridgeIsConfigured } from '@/lib/payments/bridge'
import { InvoiceClient, type InvoiceViewModel } from './InvoiceClient'

export const metadata = {
  title: 'Subscription Invoice',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function PayInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string; token: string }>
  searchParams: Promise<{ returned?: string }>
}) {
  const { orderId, token } = await params
  const { returned } = await searchParams

  const payload = await getPayload({ config: configPromise })
  const order = await loadInvoiceByToken(payload, orderId, token)
  if (!order) return notFound() // wrong or guessed link looks exactly like a missing page

  const subscriptionId = typeof order.subscription === 'object' && order.subscription ? order.subscription.id : order.subscription
  const sub: any = subscriptionId
    ? await payload.findByID({ collection: 'subscriptions' as any, id: subscriptionId, depth: 0, overrideAccess: true }).catch(() => null)
    : null

  const state: InvoiceViewModel['state'] =
    order.paymentStatus === 'captured' ? 'paid' : order.status === 'pending' && order.paymentStatus === 'unpaid' ? 'open' : 'inactive'

  // Only invoice details the customer already knows - never the address or phone number.
  const invoice: InvoiceViewModel = {
    orderId: String(order.id),
    token,
    orderNumber: String(order.orderNumber || order.id),
    state,
    returnedFromPayment: returned === '1',
    month: order.cycleNumber ?? 1,
    monthsTotal: order.cyclesTotal ?? sub?.planMonths ?? 1,
    discountPercent: order.subscriptionDiscountPercent ?? 0,
    paymentMethod: order.paymentMethod === 'zelle' ? 'zelle' : 'authnet_bridge',
    cardAvailable: bridgeIsConfigured(),
    total: order.total || 0,
    subtotal: order.subtotal || 0,
    discount: order.discountTotal || 0,
    couponCode: order.couponCode || null,
    shipping: order.shippingTotal || 0,
    fees: (order.feeTotal || 0) / 100,
    dueDate: order.invoiceDueDate || null,
    paidAt: order.paidAt || null,
    subscriptionId: subscriptionId ? String(subscriptionId) : null,
    nextDueDate: sub?.status === 'active' ? sub.nextDueDate || null : null,
    items: (order.items || []).map((item: any) => ({
      name: item.productSnapshot?.name || 'Product',
      variant: item.variant && item.variant !== 'DEFAULT' ? item.variant : '',
      quantity: item.quantity || 1,
      lineTotal: (item.price || 0) * (item.quantity || 1),
    })),
  }

  return (
    <div className="pt-20">
      <InvoiceClient invoice={invoice} />
    </div>
  )
}
