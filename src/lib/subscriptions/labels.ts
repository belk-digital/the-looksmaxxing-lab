/**
 * Customer-facing words for the subscription model.
 *
 * A plan is "an order every N months, until the customer pauses it": 1 = every month, 3 = every 3 months,
 * 6 = every 6 months. (The stored field is still called `planMonths`; it now holds that interval.)
 * Pure, so every screen, email and test uses the same wording.
 */

/** "every month" / "every 3 months" (lower case, for the middle of a sentence). */
export const everyLabel = (months: number): string => (months === 1 ? 'every month' : `every ${months} months`)

/** "Every month" / "Every 3 months" (start of a sentence or a plan title). */
export const EveryLabel = (months: number): string => (months === 1 ? 'Every month' : `Every ${months} months`)

/** "Order 3" - the number of this order within the subscription (1 = the first order). */
export const orderLabel = (cycle?: number | null): string => (cycle && cycle > 0 ? `Order ${cycle}` : 'Subscription order')

/** "1 order" / "5 orders" */
export const ordersCount = (n: number): string => `${n} ${n === 1 ? 'order' : 'orders'}`
