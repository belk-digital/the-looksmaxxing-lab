import type { Payload } from 'payload'
import { verifyCoupon, getUserMaxxPoints } from '@/app/(frontend)/(shop)/actions'
import { loadShippingMethods, loadActiveProcessingFees } from './data'
import { applyPlanDiscount } from '@/lib/subscriptions/discount'
import { getSubscriptionSettings, findActivePlan } from '@/lib/subscriptions/settings'

/**
 * The single source of truth for what an order costs. Used by the Stripe PaymentIntent, the order
 * creation, and (for subscriptions) the invoice job, so they can never disagree - the
 * payment checks compare the amounts produced here.
 */

export interface PricingOptions {
  /** Reject carts that exceed available stock. Default true. */
  checkStock?: boolean
  /** Reject carts whose client price snapshot differs from the live price. Default true. */
  detectPriceChange?: boolean
  /**
   * Price every item as part of this subscription plan (used for later invoices of an existing
   * subscription: the discount is the one locked in at purchase, and eligibility checks are skipped).
   */
  plan?: { months: number; discountPercent: number }
  /** If the chosen shipping method's minimum order is no longer met, fall back instead of failing. */
  lenientShipping?: boolean
  /**
   * The coupon is the "every order" coupon this subscription was started with (later invoices): it is
   * re-checked on those terms, and if it no longer qualifies the invoice is simply created without the discount.
   */
  recurringCoupon?: boolean
}

export interface PricingFailure {
  error: string
  updatedItems?: any[]
  priceChanged?: boolean
}

export interface PricingSuccess {
  error?: undefined
  liveItems: any[]
  productsById: Map<any, any>
  subtotal: number
  discountAmount: number
  freeShipping: boolean
  finalShipping: number
  feeTotal: number
  appliedFees: { feeId: any; feeName: string; amount: number }[]
  tax: number
  totalBeforePoints: number
  pointsToRedeem: number
  total: number
  /** Set when the cart is a subscription plan. */
  planMonths: number | null
  planDiscountPercent: number | null
  /** The shipping method actually used (may differ from the requested one when lenient). */
  shippingMethodName: string
  /** The coupon (if any) that actually gave a discount, and how long it lasts on a subscription. */
  couponApplied: boolean
  appliedCouponCode: string | null
  couponSubscriptionScope: 'first_month' | 'every_month' | null
}

export type PricingResult = PricingSuccess | PricingFailure

export const PRICE_CHANGED_MESSAGE =
  'Prices for some items have updated since they were added to your cart. We have refreshed your cart with the latest live prices.'

const toProductId = (id: any) => (!isNaN(Number(id)) ? Number(id) : id)

/** True when the SKU is a bulk-bundle SKU ("Kit of 5", "10mg - Kit of 5"), which can't be subscribed. */
export function isBulkBundleSku(product: any, sku: unknown): boolean {
  if (typeof sku !== 'string' || !Array.isArray(product?.bulkBundles)) return false
  return product.bulkBundles.some((b: any) => b?.name && (sku === b.name || sku.endsWith(' - ' + b.name)))
}

type ResolvedPlan = { months: number; discountPercent: number; forced: boolean }

async function resolvePlan(
  payload: Payload,
  items: any[],
  options: PricingOptions,
): Promise<ResolvedPlan | PricingFailure | null> {
  if (options.plan) return { ...options.plan, forced: true }
  const lengths = new Set(items.map((i) => Number(i.planMonths) || 0))
  if (lengths.size === 1 && lengths.has(0)) return null // ordinary one-time cart
  if (lengths.size > 1) {
    return { error: 'A subscription must be checked out on its own, with the same plan length for every product.' }
  }
  const months = [...lengths][0]
  const settings = await getSubscriptionSettings(payload)
  if (!settings.enabled) return { error: 'Subscriptions are not available right now.' }
  const plan = findActivePlan(settings, months)
  if (!plan) return { error: 'This subscription plan is no longer available.' }
  return { months, discountPercent: plan.discountPercent, forced: false }
}

export async function computeOrderPricing(
  payload: Payload,
  input: {
    items: any[]
    shippingMethodName: string
    couponCode?: string
    isRedeemingPoints?: boolean
  },
  options: PricingOptions = {},
): Promise<PricingResult> {
  const { items, shippingMethodName, couponCode, isRedeemingPoints } = input
  const checkStock = options.checkStock !== false
  const detectPriceChange = options.detectPriceChange !== false

  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Your cart is empty.' }
  }

  const plan = await resolvePlan(payload, items, options)
  if (plan && 'error' in plan) return plan

  // Validate items, check stock, and calculate subtotal securely on the server
  let subtotal = 0
  let pricesChanged = false
  const { revalidateCartPrices } = await import('@/app/(frontend)/actions/cart')
  let liveItems = await revalidateCartPrices(items)
  if (plan) {
    // Plan lines are priced at the live price minus the plan discount (same cents math as the browser).
    liveItems = liveItems.map((li: any) => ({
      ...li,
      planMonths: plan.months,
      priceSnapshot: applyPlanDiscount(Number(li.priceSnapshot), plan.discountPercent),
    }))
  }
  const productsById = new Map<any, any>()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const liveItem = liveItems[i]

    const itemPrice = Number(item.priceSnapshot)
    const livePrice = Number(liveItem.priceSnapshot)
    if (itemPrice !== livePrice && !(Number.isNaN(itemPrice) && Number.isNaN(livePrice))) {
      pricesChanged = true
    }

    const productRes = await payload.findByID({
      collection: 'products',
      id: toProductId(item.productId) as any,
      depth: 0,
    })
    if (!productRes) {
      return { error: `Product not found: ${item.productId}` }
    }
    productsById.set(item.productId, productRes)
    if (plan && !plan.forced) {
      if (!productRes.subscriptionEnabled) {
        return { error: `${productRes.name || 'This product'} is not available as a subscription.` }
      }
      if (isBulkBundleSku(productRes, item.variantSku)) {
        return { error: 'Bulk bundles cannot be subscribed to. Please choose a single size.' }
      }
    }
    if (checkStock && (productRes.stock || 0) < item.quantity) {
      return { error: `Insufficient stock for ${productRes.name || 'item'}. Only ${productRes.stock} left.` }
    }
    subtotal += liveItem.priceSnapshot * item.quantity
  }

  if (detectPriceChange && pricesChanged) {
    return { error: PRICE_CHANGED_MESSAGE, updatedItems: liveItems, priceChanged: true }
  }

  let discountAmount = 0
  let freeShipping = false
  let couponApplied = false
  let appliedCouponCode: string | null = null
  let couponSubscriptionScope: 'first_month' | 'every_month' | null = null

  if (couponCode) {
    const couponRes = await verifyCoupon(couponCode, subtotal, liveItems, { recurringInvoice: options.recurringCoupon === true })
    if (couponRes.valid) {
      discountAmount = couponRes.discount || 0
      freeShipping = couponRes.freeShipping || false
      couponApplied = true
      appliedCouponCode = couponRes.code || couponCode
      couponSubscriptionScope = (couponRes.subscriptionScope as 'first_month' | 'every_month' | null | undefined) ?? null
    } else if (plan && !plan.forced) {
      // A subscription checkout must never quietly charge more than the customer was shown (for example a coupon that
      // was switched off for subscriptions in the meantime): say so instead.
      return { error: couponRes.error || 'This coupon cannot be used on this subscription.' }
    }
  }

  const methods = await loadShippingMethods(payload)
  let selectedMethod = methods.find((m: any) => m.method === shippingMethodName) || methods[0]

  // Validate minOrderAmount for the selected shipping method
  if (selectedMethod?.minOrderAmount && selectedMethod.minOrderAmount > 0 && subtotal < selectedMethod.minOrderAmount) {
    if (!options.lenientShipping) {
      return {
        error: `Your cart subtotal must be at least $${selectedMethod.minOrderAmount} to use ${selectedMethod.method}.`,
      }
    }
    // Later invoices: a later price change must not block the invoice - use a method with no minimum.
    selectedMethod = methods.find((m: any) => !m.minOrderAmount) || methods[0]
  }
  const usedShippingName: string = selectedMethod?.method ?? shippingMethodName

  const shippingCost = (selectedMethod?.price || 0) / 100

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const isExpressShipping = (usedShippingName || '').toLowerCase().includes('express')
  const finalShipping = freeShipping && !isExpressShipping ? 0 : shippingCost

  // Dynamic processing fees (mandatory ones only)
  const activeFees = await loadActiveProcessingFees(payload)
  let feeTotal = 0
  const appliedFees: PricingSuccess['appliedFees'] = []
  activeFees.forEach((fee: any) => {
    if (!fee.isOptional) {
      const amount =
        fee.type === 'percentage' ? subtotalAfterDiscount * (fee.amount / 100) : fee.amount / 100
      feeTotal += amount
      appliedFees.push({
        feeId: fee.id,
        feeName: fee.name,
        amount: Math.round(amount * 100), // cents for the Payload array
      })
    }
  })

  const tax = 0 // Statically 0 now, handled by ProcessingFees
  const totalBeforePoints = subtotalAfterDiscount + finalShipping + tax + feeTotal

  let pointsToRedeem = 0
  if (isRedeemingPoints) {
    const availablePoints = await getUserMaxxPoints()
    pointsToRedeem = Math.min(availablePoints, totalBeforePoints)
  }

  const total = totalBeforePoints - pointsToRedeem

  return {
    liveItems,
    productsById,
    subtotal,
    discountAmount,
    freeShipping,
    finalShipping,
    feeTotal,
    appliedFees,
    tax,
    totalBeforePoints,
    pointsToRedeem,
    total,
    planMonths: plan ? plan.months : null,
    planDiscountPercent: plan ? plan.discountPercent : null,
    shippingMethodName: usedShippingName,
    couponApplied,
    appliedCouponCode,
    couponSubscriptionScope,
  }
}
