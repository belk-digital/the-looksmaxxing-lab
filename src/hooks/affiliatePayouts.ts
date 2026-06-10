import type { CollectionAfterChangeHook } from 'payload'
import { updateAffiliateStats } from '@/lib/affiliates/stats'

export const afterAffiliatePayoutChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation === 'create' || operation === 'update') {
    const isNowPaid = doc.status === 'paid' && (operation === 'create' || previousDoc?.status !== 'paid')
    
    if (isNowPaid && doc.conversions && doc.conversions.length > 0) {
      const conversionIds = doc.conversions.map((c: any) => typeof c === 'object' ? c.id : c)
      
      // Update all linked conversions to 'paid' status
      for (const convId of conversionIds) {
        await req.payload.update({
          collection: 'affiliate-conversions',
          id: convId,
          data: {
            status: 'paid',
            paidAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })
      }
    }

    const affiliateId = typeof doc.affiliate === 'object' ? doc.affiliate.id : doc.affiliate
    if (affiliateId) {
      updateAffiliateStats(affiliateId, req.payload).catch(console.error)
    }
  }
  return doc
}
