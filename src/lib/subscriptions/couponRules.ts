/**
 * Which coupons may be used on a subscription. Pure rules (no database), so they are easy to test.
 *
 * Every coupon has a switch "Can be used on subscriptions" (default OFF). A coupon without it is rejected on any
 * cart that contains a subscription plan; with it, the coupon works on subscriptions AND on normal purchases.
 * A coupon that is switched on also says how long the discount lasts: first month only, or every monthly payment.
 */
export type SubscriptionCouponScope = 'first_month' | 'every_month'

export const SUBSCRIPTION_COUPON_MESSAGE = "This coupon can't be used on subscriptions."
export const RECURRING_COUPON_GONE_MESSAGE = 'This coupon no longer applies to every monthly payment.'

export interface CouponLike {
  allowOnSubscriptions?: boolean | null
  subscriptionDiscountScope?: string | null
}

export const couponScopeOf = (coupon: CouponLike): SubscriptionCouponScope =>
  coupon.subscriptionDiscountScope === 'every_month' ? 'every_month' : 'first_month'

export type CouponRuleResult = { ok: true; scope: SubscriptionCouponScope | null } | { ok: false; error: string }

/**
 * @param isSubscriptionCart  the cart holds a subscription plan
 * @param recurringInvoice    the coupon is being applied to a LATER monthly invoice of a subscription that was started with it
 */
export function couponRuleForCart(coupon: CouponLike, opts: { isSubscriptionCart: boolean; recurringInvoice?: boolean }): CouponRuleResult {
  if (opts.recurringInvoice) {
    // A later monthly invoice keeps the discount only while the coupon is still a "subscription + every month" coupon.
    return coupon.allowOnSubscriptions === true && couponScopeOf(coupon) === 'every_month'
      ? { ok: true, scope: 'every_month' }
      : { ok: false, error: RECURRING_COUPON_GONE_MESSAGE }
  }
  if (!opts.isSubscriptionCart) return { ok: true, scope: null } // normal purchase: nothing changes
  if (coupon.allowOnSubscriptions !== true) return { ok: false, error: SUBSCRIPTION_COUPON_MESSAGE }
  return { ok: true, scope: couponScopeOf(coupon) }
}

/** Plain-words note shown next to an applied coupon on a subscription checkout. */
export function couponScopeNote(scope: SubscriptionCouponScope | null | undefined): string {
  if (scope === 'every_month') return 'Applies to every monthly payment of your plan.'
  if (scope === 'first_month') return 'Applies to your first payment only.'
  return ''
}
