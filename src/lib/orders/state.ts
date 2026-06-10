import { APIError } from 'payload'

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
  pending: ['paid', 'cancelled', 'refunded', 'shipped', 'completed'],
  paid: ['fulfilled', 'shipped', 'completed', 'refunded', 'cancelled'],
  fulfilled: ['shipped', 'completed', 'refunded', 'cancelled'],
  shipped: ['completed', 'refunded', 'cancelled'],
  completed: ['refunded', 'cancelled'],
  refunded: ['pending', 'paid', 'completed'],
  cancelled: ['pending', 'paid'],
}

export const validateStatusTransition = (oldStatus: OrderStatus, newStatus: OrderStatus) => {
  const allowed = validTransitions[oldStatus] ?? []
  if (!allowed.includes(newStatus)) {
    throw new APIError(
      `Invalid status transition from "${oldStatus}" to "${newStatus}". Allowed transitions: ${allowed.join(', ')}`,
      400,
      null,
      true
    )
  }
}
