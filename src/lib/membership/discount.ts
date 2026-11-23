/**
 * The member discount: logged-in customers get MEMBER_DISCOUNT_PERCENT % off their order.
 *
 * This file is the single definition of the rule, and it is pure maths (no server or browser access), so the server
 * (which decides what is actually charged, src/lib/checkout/pricing.ts) and the pages that SHOW the discount (cart,
 * checkout) always agree to the cent.
 *
 * The rule, and why:
 *  - It is MEMBER_DISCOUNT_PERCENT % of the merchandise subtotal (what the items cost before shipping and fees), rounded to the
 *    nearest cent.
 *  - It applies to ordinary one-time orders placed while logged in. It does not apply to subscription plans: those have
 *    their own plan discount (15-25%), and a plan's invoices are created without a customer present.
 *  - It CANNOT BE COMBINED with any other discount. If the customer also enters a discount code (a percentage, a fixed
 *    amount, free shipping...), the order gets WHICHEVER SAVES MORE, never both. If the member discount saves the same
 *    or more, it applies and the code is not used (it is not counted as used, and is not recorded on the order); if the
 *    code saves more, it applies and the member discount does not.
 *  - Gift cards / store credit are the one exception: they are money the customer already holds, not a discount, so they
 *    are paid on top of the member discount (the member discount comes off first, the credit covers the rest). Flip
 *    MEMBER_DISCOUNT_STACKS_WITH_STORE_CREDIT to treat them like any other code.
 *  - It is decided on the server from the login session, never from anything the browser sends.
 */

/** Percent off for logged-in customers. Change it here and everything (checkout, emails, popup) follows. */
export const MEMBER_DISCOUNT_PERCENT = 15

/** What the discount is called wherever it is shown to the customer. */
export const MEMBER_DISCOUNT_LABEL = 'Member discount'

/** Gift cards / store credit are paid on top of the member discount (see the rule above). */
export const MEMBER_DISCOUNT_STACKS_WITH_STORE_CREDIT = true

/** "Member discount (15%)" - the label for a discount line. */
export function memberDiscountLabel(percent: number | null | undefined = MEMBER_DISCOUNT_PERCENT): string {
  return percent && percent > 0 ? `${MEMBER_DISCOUNT_LABEL} (${percent}%)` : MEMBER_DISCOUNT_LABEL
}

const toCents = (dollars: number) => Math.round(dollars * 100)

/** The member discount in dollars for a merchandise subtotal in dollars (0 when there is nothing to discount). */
export function memberDiscountAmount(subtotal: number, percent: number = MEMBER_DISCOUNT_PERCENT): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0 || !Number.isFinite(percent) || percent <= 0) return 0
  return Math.round((toCents(subtotal) * Math.min(percent, 100)) / 100) / 100
}

/** A coupon as the discount rule sees it: what it would save on its own, and whether it is a gift card. */
export interface CouponForDiscount {
  /** What the coupon would take off on its own (dollars), as the coupon rules already compute it. 0 for free shipping. */
  discount: number
  /** Gift card / store credit: money the customer already holds, paid on top of the member discount. */
  isStoreCredit?: boolean
}

export interface DiscountSplit {
  /** The member discount actually given (dollars). */
  memberDiscount: number
  /** The coupon discount actually given (dollars). */
  couponDiscount: number
  /** Everything taken off the subtotal (dollars); never more than the subtotal. */
  totalDiscount: number
  /** A coupon was offered but is NOT used, because the member discount saves the same or more (they do not combine). */
  couponDisplaced: boolean
  /** The member discount is NOT given, because the coupon saves more (they do not combine). */
  memberDisplaced: boolean
}

const cleanAmount = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0)

/**
 * Works out the discount on an order from the member discount and an optional coupon.
 * For a non-member this returns the coupon discount untouched, so nothing changes for logged-out orders.
 */
export function splitDiscounts(args: {
  subtotal: number
  coupon: CouponForDiscount | null | undefined
  isMember: boolean
  percent?: number
}): DiscountSplit {
  const couponAmount = cleanAmount(args.coupon?.discount)
  const none = { couponDisplaced: false, memberDisplaced: false }
  if (!args.isMember) return { memberDiscount: 0, couponDiscount: couponAmount, totalDiscount: couponAmount, ...none }

  const subtotalCents = Math.max(0, toCents(args.subtotal))
  const memberCents = toCents(memberDiscountAmount(args.subtotal, args.percent))
  // Nothing to give (an empty or tiny cart): the member discount is not in play, the coupon just works as it always did.
  if (memberCents <= 0) return { memberDiscount: 0, couponDiscount: couponAmount, totalDiscount: couponAmount, ...none }
  if (!args.coupon) return { memberDiscount: memberCents / 100, couponDiscount: 0, totalDiscount: memberCents / 100, ...none }

  // Gift card / store credit: paid on top. The member discount comes off first; the credit covers the rest, never more
  // than what is left of the subtotal (so it keeps whatever it did not need).
  if (args.coupon.isStoreCredit && MEMBER_DISCOUNT_STACKS_WITH_STORE_CREDIT) {
    const creditCents = Math.min(toCents(couponAmount), Math.max(0, subtotalCents - memberCents))
    return { memberDiscount: memberCents / 100, couponDiscount: creditCents / 100, totalDiscount: (memberCents + creditCents) / 100, ...none }
  }

  // Any other coupon does not combine: whichever saves MORE applies. (An exact tie goes to the member discount.)
  if (toCents(couponAmount) > memberCents) {
    return { memberDiscount: 0, couponDiscount: couponAmount, totalDiscount: couponAmount, couponDisplaced: false, memberDisplaced: true }
  }
  return { memberDiscount: memberCents / 100, couponDiscount: 0, totalDiscount: memberCents / 100, couponDisplaced: true, memberDisplaced: false }
}

/**
 * How much of an order's discount came from a coupon (what the coupon rules - store-credit balance, affiliate
 * commission - care about). Orders from before the member discount existed have no member part, so for them this is
 * the whole discount, unchanged.
 */
export function couponPartOfDiscount(order: { discountTotal?: number | null; memberDiscountTotal?: number | null }): number {
  const total = Number(order.discountTotal) || 0
  const member = Number(order.memberDiscountTotal) || 0
  return Math.max(0, Math.round((total - member) * 100) / 100)
}
