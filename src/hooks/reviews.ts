import type { CollectionBeforeValidateHook } from "payload"
import { Payload } from 'payload'

export const beforeValidateReview: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data) return data
  // If an order is linked, verify it is delivered/completed
  if (data.order) {
    const order = await req.payload.find({
      collection: 'orders',
      where: { id: { equals: data.order } },
      depth: 0,
    })
    const orderDoc = order?.docs?.[0]
    if (!orderDoc) {
      throw new Error('Linked order not found')
    }
    const deliveredStatuses = ['shipped', 'completed']
    if (deliveredStatuses.includes(orderDoc.status)) {
      data.verifiedPurchase = true
    } else {
      throw new Error('Cannot create review: order not delivered')
    }
  }
  return data
}
