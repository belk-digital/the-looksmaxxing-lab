export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'fulfilled'
  | 'shipped'
  | 'completed'
  | 'refunded'
  | 'cancelled'
export type PaymentStatus = 'unpaid' | 'authorized' | 'captured' | 'refunded'
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled'

export const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['fulfilled', 'refunded', 'cancelled'],
  fulfilled: ['shipped', 'completed'],
  shipped: ['completed'],
  completed: [],
  refunded: [],
  cancelled: [],
}

export const validateStatusTransition = (oldStatus: OrderStatus, newStatus: OrderStatus) => {
  const allowed = validTransitions[oldStatus] ?? []
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from "${oldStatus}" to "${newStatus}". Allowed: ${allowed.join(', ')}`,
    )
  }
}
