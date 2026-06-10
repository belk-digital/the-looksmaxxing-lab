import type { CollectionAfterChangeHook } from 'payload'
import { updateAffiliateStats } from '@/lib/affiliates/stats'

export const afterAffiliateClickChange: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation === 'create' || operation === 'update') {
    // Run stat update asynchronously so it doesn't block the request
    const affiliateId = typeof doc.affiliate === 'object' ? doc.affiliate.id : doc.affiliate
    if (affiliateId) {
      // Intentionally not awaiting to let it run in the background
      updateAffiliateStats(affiliateId, req.payload).catch(console.error)
    }
  }
  return doc
}
