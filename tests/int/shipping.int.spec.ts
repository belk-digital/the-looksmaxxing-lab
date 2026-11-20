/**
 * Shipping: every order ships by Express Shipping ($20, 2-3 business days).
 *
 * What is tested (pure code, no database, no network):
 * - The wording: "2-3 business days" for Express wherever the delivery time is shown, however the method is spelled and
 *   whether or not the admin filled in "estimated days" (it is a single number and cannot say "2-3").
 * - Orders placed with another method keep their old wording.
 * - The fallback used when no shipping zone exists is the single Express method at $20.
 * - The order email says "Express Shipping · 2-3 business days".
 */

import { describe, it, expect } from 'vitest'
import {
  EXPRESS_DELIVERY_TIME,
  EXPRESS_SHIPPING_NAME,
  EXPRESS_SHIPPING_PRICE_CENTS,
  FALLBACK_SHIPPING_METHODS,
  deliveryTimeLabel,
  estimatedDeliveryText,
  isExpressShippingName,
} from '../../src/lib/checkout/shipping'
import { loadShippingMethods } from '../../src/lib/checkout/data'
import { generateOrderInvoiceHtml } from '../../src/lib/emails/generateOrderEmail'

describe('the shipping constants', () => {
  it('say Express Shipping, $20, 2-3 business days', () => {
    expect(EXPRESS_SHIPPING_NAME).toBe('Express Shipping')
    expect(EXPRESS_SHIPPING_PRICE_CENTS).toBe(2000)
    expect(EXPRESS_DELIVERY_TIME).toBe('2-3 business days')
  })
})

describe('isExpressShippingName', () => {
  it.each(['Express Shipping', 'express', 'EXPRESS', 'Express (2-3 days)', 'Overnight Express'])('"%s" is express', (name) => {
    expect(isExpressShippingName(name)).toBe(true)
  })
  it.each(['Standard Shipping', 'Free Shipping', '', undefined, null, 42, {}])('%s is not', (name) => {
    expect(isExpressShippingName(name)).toBe(false)
  })
})

describe('deliveryTimeLabel (shown under the shipping option at checkout)', () => {
  it('Express is always "2-3 business days", whatever the admin entered', () => {
    expect(deliveryTimeLabel({ method: 'Express Shipping' })).toBe('2-3 business days')
    expect(deliveryTimeLabel({ method: 'Express Shipping', estimatedDays: null })).toBe('2-3 business days')
    expect(deliveryTimeLabel({ method: 'Express Shipping', estimatedDays: undefined })).toBe('2-3 business days')
    expect(deliveryTimeLabel({ method: 'Express Shipping', estimatedDays: 2 })).toBe('2-3 business days')
    expect(deliveryTimeLabel({ method: 'Express Shipping', estimatedDays: 7 })).toBe('2-3 business days')
    expect(deliveryTimeLabel({ method: 'express', estimatedDays: 1 })).toBe('2-3 business days')
  })

  it('another method keeps its own wording, as before', () => {
    expect(deliveryTimeLabel({ method: 'Standard Shipping', estimatedDays: 5 })).toBe('5-7 business days')
    expect(deliveryTimeLabel({ method: 'Ground', estimatedDays: 4 })).toBe('4 business days')
    expect(deliveryTimeLabel({ method: 'Ground', estimatedDays: '3' })).toBe('3 business days')
  })

  it('says nothing when there is nothing to say', () => {
    expect(deliveryTimeLabel({ method: 'Ground' })).toBeNull()
    expect(deliveryTimeLabel({ method: 'Ground', estimatedDays: null })).toBeNull()
    expect(deliveryTimeLabel({ method: 'Ground', estimatedDays: 0 })).toBeNull()
    expect(deliveryTimeLabel({ method: 'Ground', estimatedDays: NaN })).toBeNull()
    expect(deliveryTimeLabel(null)).toBeNull()
    expect(deliveryTimeLabel(undefined)).toBeNull()
  })
})

describe('estimatedDeliveryText (the order confirmation page)', () => {
  it('Express Shipping reads 2-3 Business Days (it used to read 5-7 because the check compared against the exact word "express")', () => {
    expect(estimatedDeliveryText('Express Shipping')).toBe('2-3 Business Days')
    expect(estimatedDeliveryText('express')).toBe('2-3 Business Days')
  })
  it('an older order placed with another method keeps the 5-7 it always showed', () => {
    expect(estimatedDeliveryText('Standard Shipping')).toBe('5-7 Business Days')
    expect(estimatedDeliveryText(undefined)).toBe('5-7 Business Days')
    expect(estimatedDeliveryText('')).toBe('5-7 Business Days')
  })
})

describe('the fallback when no shipping zone exists', () => {
  it('is the single Express method at $20', () => {
    expect(FALLBACK_SHIPPING_METHODS).toEqual([{ method: 'Express Shipping', price: 2000, estimatedDays: 2 }])
  })

  it('loadShippingMethods uses it, and hands out a copy nobody can change by accident', async () => {
    const empty: any = { find: async () => ({ docs: [] }) }
    const first = await loadShippingMethods(empty)
    expect(first).toEqual([{ method: 'Express Shipping', price: 2000, estimatedDays: 2 }])
    first[0].price = 1
    const second = await loadShippingMethods(empty)
    expect(second[0].price).toBe(2000)
  })

  it('loadShippingMethods uses the admin\'s zone when there is one', async () => {
    const zone = [{ method: 'Express Shipping', price: 2000, estimatedDays: null }]
    const payload: any = { find: async () => ({ docs: [{ methods: zone }] }) }
    expect(await loadShippingMethods(payload)).toEqual(zone)
  })
})

describe('the order email', () => {
  const order = (shippingMethod: string | undefined) => ({
    id: 77,
    orderNumber: '1077',
    createdAt: '2026-11-20T10:00:00.000Z',
    customerFirstName: 'Ada',
    customerLastName: 'Lovelace',
    guestEmail: 'ada@example.com',
    shippingAddress: { line1: '1 Main St', city: 'Austin', state: 'TX', postalCode: '73301', country: 'US' },
    items: [{ productSnapshot: { name: 'BPC-157' }, variant: 'DEFAULT', price: 20, quantity: 2 }],
    subtotal: 40,
    shippingTotal: 20,
    total: 60,
    shippingMethod,
    paymentMethod: 'stripe',
    paymentStatus: 'captured',
  })
  const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&middot;/g, '·').replace(/\s+/g, ' ')

  it('names the shipping method and the delivery time', async () => {
    expect(text(await generateOrderInvoiceHtml(order('Express Shipping')))).toContain('Shipping (Express Shipping · 2-3 business days) $20.00')
  })

  it('an order with no delivery time on record reads exactly as before', async () => {
    const t = text(await generateOrderInvoiceHtml(order('Ground')))
    expect(t).toContain('Shipping (Ground) $20.00')
    expect(t).not.toContain('business days')
    expect(text(await generateOrderInvoiceHtml(order(undefined)))).toContain('Shipping (Standard)')
  })
})
