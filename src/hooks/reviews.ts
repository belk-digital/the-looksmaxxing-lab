import { HookArgs } from 'payload'
import { Payload } from 'payload'

export const beforeValidateReview = async ({ data, req }: HookArgs) => {
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
