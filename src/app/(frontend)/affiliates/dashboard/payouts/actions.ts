'use server'

import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function requestPayout() {
  try {
    const user = await getPayloadUser()
    if (!user) {
      return { success: false, error: 'Unauthorized. Please log in.' }
    }

    const payload = await getPayload({ config })

    // Fetch User's Affiliate Record
    const { docs: affiliates } = await payload.find({
      collection: 'affiliates',
      where: { user: { equals: user.id } },
      limit: 1,
      overrideAccess: true,
    })

    if (affiliates.length === 0 || affiliates[0].status !== 'approved') {
      return { success: false, error: 'You do not have an active affiliate account.' }
    }

    const affiliate = affiliates[0]

    // Check if they meet minimum threshold
    const threshold = affiliate.minimumPayoutThreshold || 5000 // default $50
    const available = affiliate.totalCommissionApproved || 0

    if (available < threshold) {
      return { success: false, error: `You have not reached the minimum payout threshold of $${(threshold / 100).toFixed(2)}.` }
    }

    // Check if there is already a pending request
    const { docs: existingRequests } = await payload.find({
      collection: 'affiliate-payouts',
      where: { 
        and: [
          { affiliate: { equals: affiliate.id } },
          { status: { in: ['draft', 'processing'] } }
        ]
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existingRequests.length > 0) {
      return { success: false, error: 'You already have a pending payout request.' }
    }

    // Fetch all approved conversions for this affiliate
    const { docs: approvedConversions } = await payload.find({
      collection: 'affiliate-conversions',
      where: {
        and: [
          { affiliate: { equals: affiliate.id } },
          { status: { equals: 'approved' } }
        ]
      },
      limit: 1000,
      overrideAccess: true,
    })

    if (approvedConversions.length === 0) {
      return { success: false, error: 'No approved commissions found to pay out.' }
    }

    const conversionIds = approvedConversions.map(c => c.id)
    const totalAmount = approvedConversions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0)

    // Create the payout request
    await payload.create({
      collection: 'affiliate-payouts',
      data: {
        affiliate: affiliate.id,
        conversions: conversionIds as any,
        conversionCount: conversionIds.length,
        totalAmountCents: totalAmount,
        currency: (affiliate.payoutCurrency as any) || 'USD',
        status: 'draft', // Draft signals a request
      },
      overrideAccess: true,
    })

    revalidatePath('/affiliates/dashboard/payouts', 'page')

    return { success: true }
  } catch (error: any) {
    console.error('Error requesting payout:', error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}
