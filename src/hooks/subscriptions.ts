import type { CollectionAfterChangeHook } from 'payload'

/**
 * When staff change a subscription's Status in the admin (e.g. to Paused or Cancelled), make the
 * rest of the system follow: unpaid invoices are cancelled, resuming creates the next invoice, etc.
 * The same rules are used for customer actions, so admin and customer behave identically.
 */
export const afterSubscriptionChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || !previousDoc) return doc
  if (req.context?.skipSubscriptionHook) return doc
  if (previousDoc.status === doc.status) return doc

  const { onSubscriptionStatusChanged } = await import('@/lib/subscriptions/service')
  await onSubscriptionStatusChanged(req.payload, doc, previousDoc.status, req)
  return doc
}
