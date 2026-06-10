import type { CollectionAfterChangeHook } from 'payload'
import { updateAffiliateStats } from '@/lib/affiliates/stats'

export const afterPayoutRequestChange: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation === 'create' || operation === 'update') {
    const affiliateId = typeof doc.affiliate === 'object' ? doc.affiliate.id : doc.affiliate
    
    // If status changed to paid, we could set processedAt, but that's better done in a beforeChange hook.
    // For now, we just update stats so the requested balance adjusts.
    if (affiliateId) {
      updateAffiliateStats(affiliateId, req.payload).catch(console.error)
    }
  }
  return doc
}
