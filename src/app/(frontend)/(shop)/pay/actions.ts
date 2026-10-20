'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { buildBridgeHandoff, bridgeIsConfigured } from '@/lib/payments/bridge'
import { loadInvoiceByToken, serverUrl } from '@/lib/subscriptions/invoices'

/**
 * "Pay by card" on the emailed invoice page. The signed hand-off to the Authorize.net bridge is created HERE,
 * at the moment of the click (the bridge rejects hand-offs older than 10 minutes), never in the email itself.
 */
export async function startInvoiceCardPayment(orderId: string, token: string) {
  try {
    if (!bridgeIsConfigured()) {
      return { error: 'Card payments are temporarily unavailable. Please try again later or contact support.' }
    }

    const payload = await getPayload({ config: configPromise })
    const order = await loadInvoiceByToken(payload, orderId, token)
    if (!order) return { error: 'This payment link is not valid.' }
    if (order.paymentStatus === 'captured') return { error: 'This invoice is already paid.' }
    if (order.status !== 'pending' || order.paymentStatus !== 'unpaid') {
      return { error: 'This invoice is no longer active. Please open your subscription to get a new one.' }
    }

    const amountCents = Math.round((order.total || 0) * 100)
    if (amountCents < 50) return { error: 'This invoice amount is too low to process.' }

    // Paying by card from a Zelle invoice is allowed: switch the invoice to card before handing off.
    if (order.paymentMethod !== 'authnet_bridge') {
      await payload.update({ collection: 'orders', id: order.id, data: { paymentMethod: 'authnet_bridge' } as any, overrideAccess: true })
    }

    // Affiliate attribution comes from the subscription, not from this visitor's browser cookies.
    const subId = typeof order.subscription === 'object' && order.subscription ? order.subscription.id : order.subscription
    const sub: any = subId ? await payload.findByID({ collection: 'subscriptions' as any, id: subId, depth: 0, overrideAccess: true }).catch(() => null) : null
    const affiliateId = sub?.affiliate && typeof sub.affiliate === 'object' ? sub.affiliate.id : sub?.affiliate

    const base = serverUrl()
    const invoicePage = `${base}/pay/${order.id}/${token}`
    return buildBridgeHandoff({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountCents,
      email: order.guestEmail || '',
      firstName: order.customerFirstName || '',
      lastName: order.customerLastName || '',
      returnUrl: `${invoicePage}?returned=1`,
      cancelUrl: invoicePage,
      affiliateId: affiliateId ? String(affiliateId) : null,
      clickId: sub?.affiliateClickId || null,
    })
  } catch (error: any) {
    console.error('Failed to start invoice card payment:', error)
    return { error: 'Something went wrong starting your payment. Please try again.' }
  }
}
