import type { Payload } from 'payload'

/** Shipping methods of the first shipping zone, with the same fallback the checkout has always used. */
export async function loadShippingMethods(payload: Payload): Promise<any[]> {
  const zones = await payload.find({
    collection: 'shippingzones',
    limit: 1,
    depth: 0,
  })

  if (zones.docs.length > 0 && zones.docs[0].methods) {
    return zones.docs[0].methods as any[]
  }

  // Fallback if none exist
  return [
    { method: 'Standard Shipping', price: 0, estimatedDays: 5 },
    { method: 'Express Shipping', price: 2500, estimatedDays: 2 },
  ]
}

export async function loadActiveProcessingFees(payload: Payload): Promise<any[]> {
  const fees = await payload.find({
    collection: 'processing-fees',
    depth: 0,
    overrideAccess: true,
    limit: 100,
  })
  return fees.docs.filter((f: any) => f.isActive)
}
