import type Stripe from 'stripe'

/** Order totals are stored in dollars; Stripe and the bridge both speak cents. */
export function orderTotalCents(order: { total?: number | null }): number {
  return Math.round((order.total || 0) * 100)
}

export const STRIPE_OPEN_STATUSES = ['requires_payment_method', 'requires_confirmation', 'requires_action']

/**
 * Confirms that a succeeded Stripe PaymentIntent is genuinely the payment for this order:
 * bound to it via metadata, paid in full, in USD, and the order is a Stripe order.
 */
export function checkStripePaymentCoversOrder(
  paymentIntent: Pick<Stripe.PaymentIntent, 'id' | 'status' | 'amount' | 'amount_received' | 'currency' | 'metadata'>,
  order: { id: string | number; total?: number | null; paymentMethod?: string | null },
): { ok: true } | { ok: false; reason: string } {
  if (paymentIntent.status !== 'succeeded') {
    return { ok: false, reason: `PaymentIntent status is "${paymentIntent.status}"` }
  }
  if (order.paymentMethod !== 'stripe') {
    return { ok: false, reason: `Order payment method is "${order.paymentMethod}", not stripe` }
  }
  if (String(paymentIntent.metadata?.orderId) !== String(order.id)) {
    return { ok: false, reason: 'PaymentIntent is not bound to this order' }
  }
  if (paymentIntent.currency !== 'usd') {
    return { ok: false, reason: `Unexpected currency "${paymentIntent.currency}"` }
  }
  const paid = paymentIntent.amount_received || paymentIntent.amount
  const expected = orderTotalCents(order)
  if (paid !== expected) {
    return { ok: false, reason: `Paid ${paid} cents but order total is ${expected} cents` }
  }
  return { ok: true }
}
