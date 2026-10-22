import { describe, it, expect } from 'vitest'
import {
  couponRuleForCart,
  couponScopeOf,
  couponScopeNote,
  SUBSCRIPTION_COUPON_MESSAGE,
  RECURRING_COUPON_GONE_MESSAGE,
} from '@/lib/subscriptions/couponRules'

describe('couponRuleForCart: which coupons may be used on a subscription', () => {
  it('a normal purchase is unaffected, whatever the coupon\'s subscription setting', () => {
    expect(couponRuleForCart({}, { isSubscriptionCart: false })).toEqual({ ok: true, scope: null })
    expect(couponRuleForCart({ allowOnSubscriptions: false }, { isSubscriptionCart: false })).toEqual({ ok: true, scope: null })
    expect(couponRuleForCart({ allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' }, { isSubscriptionCart: false })).toEqual({ ok: true, scope: null })
  })

  it('on a subscription, a coupon is rejected unless it was switched on for subscriptions (default: off)', () => {
    for (const coupon of [{}, { allowOnSubscriptions: false }, { allowOnSubscriptions: null }, { allowOnSubscriptions: undefined, subscriptionDiscountScope: 'every_month' }]) {
      expect(couponRuleForCart(coupon, { isSubscriptionCart: true }), JSON.stringify(coupon)).toEqual({ ok: false, error: SUBSCRIPTION_COUPON_MESSAGE })
    }
  })

  it('a coupon switched on for subscriptions is accepted, and says how long it lasts (first order only by default)', () => {
    expect(couponRuleForCart({ allowOnSubscriptions: true }, { isSubscriptionCart: true })).toEqual({ ok: true, scope: 'first_month' })
    expect(couponRuleForCart({ allowOnSubscriptions: true, subscriptionDiscountScope: 'first_month' }, { isSubscriptionCart: true })).toEqual({ ok: true, scope: 'first_month' })
    expect(couponRuleForCart({ allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' }, { isSubscriptionCart: true })).toEqual({ ok: true, scope: 'every_month' })
  })

  it('an unknown scope value is treated as "first order only" (never silently recurring)', () => {
    expect(couponScopeOf({ subscriptionDiscountScope: 'forever' })).toBe('first_month')
    expect(couponScopeOf({ subscriptionDiscountScope: null })).toBe('first_month')
  })

  it('a LATER invoice keeps the discount only while the coupon is still "subscriptions + every order"', () => {
    expect(couponRuleForCart({ allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' }, { isSubscriptionCart: true, recurringInvoice: true })).toEqual({ ok: true, scope: 'every_month' })
    // switched off later, or changed to first-month-only: the discount stops
    expect(couponRuleForCart({ allowOnSubscriptions: false, subscriptionDiscountScope: 'every_month' }, { isSubscriptionCart: true, recurringInvoice: true })).toEqual({ ok: false, error: RECURRING_COUPON_GONE_MESSAGE })
    expect(couponRuleForCart({ allowOnSubscriptions: true, subscriptionDiscountScope: 'first_month' }, { isSubscriptionCart: true, recurringInvoice: true })).toEqual({ ok: false, error: RECURRING_COUPON_GONE_MESSAGE })
    expect(couponRuleForCart({}, { isSubscriptionCart: true, recurringInvoice: true })).toEqual({ ok: false, error: RECURRING_COUPON_GONE_MESSAGE })
  })

  it('the checkout note explains the scope in plain words', () => {
    expect(couponScopeNote('first_month')).toBe('Applies to your first payment only.')
    expect(couponScopeNote('every_month')).toBe('Applies to every order of your subscription.')
    expect(couponScopeNote(null)).toBe('')
  })
})
