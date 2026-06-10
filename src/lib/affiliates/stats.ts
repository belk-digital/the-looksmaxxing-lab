import { Payload } from 'payload'

export async function updateAffiliateStats(affiliateId: string | number, payload: Payload) {
  const numericId = typeof affiliateId === 'string' && !isNaN(Number(affiliateId)) ? Number(affiliateId) : affiliateId;

  // 1. Get all clicks
  const clicks = await payload.find({
    collection: 'affiliate-clicks',
    where: { affiliate: { equals: numericId } },
    limit: 100000, // For production, you might want to use aggregation queries via db directly, but this is fine for now
    overrideAccess: true,
  })

  const totalClicks = clicks.totalDocs
  
  // Unique clicks (deduplicated by ipHash)
  const uniqueIps = new Set(clicks.docs.map((c: any) => c.ipHash).filter(Boolean))
  const uniqueClicks = uniqueIps.size

  // Get last click date
  const lastClick = await payload.find({
    collection: 'affiliate-clicks',
    where: { affiliate: { equals: numericId } },
    sort: '-clickedAt',
    limit: 1,
    overrideAccess: true,
  })
  const lastClickAt = lastClick.docs[0]?.clickedAt || null

  // 2. Get all conversions
  const conversions = await payload.find({
    collection: 'affiliate-conversions',
    where: { 
      affiliate: { equals: numericId },
      status: { not_equals: 'voided' } // Exclude voided
    },
    limit: 100000,
    overrideAccess: true,
  })

  // Filter out reversed for some stats
  const activeConversions = conversions.docs.filter((c: any) => c.status !== 'reversed')
  const totalConversions = activeConversions.length

  let totalRevenue = 0
  let totalCommissionEarned = 0
  let totalCommissionPending = 0
  let totalCommissionApproved = 0

  for (const conv of conversions.docs) {
    if (conv.status === 'reversed') continue

    totalRevenue += (conv.orderSubtotal || 0)
    
    // Earned includes everything except reversed/voided
    totalCommissionEarned += (conv.commissionAmount || 0)

    if (conv.status === 'pending') {
      totalCommissionPending += (conv.commissionAmount || 0)
    } else if (conv.status === 'approved' || conv.status === 'paid') {
      // In the new system, all passed-15-days are considered "approved" pool
      totalCommissionApproved += (conv.commissionAmount || 0)
    }
  }

  // 3. Get Payout Requests to calculate Requested and Paid
  const payoutRequests = await payload.find({
    collection: 'payout-requests',
    where: { affiliate: { equals: numericId } },
    limit: 100000,
    overrideAccess: true,
  })

  let totalCommissionRequested = 0
  let totalCommissionPaid = 0

  for (const pr of payoutRequests.docs) {
    if (pr.status === 'pending' || pr.status === 'approved') {
      totalCommissionRequested += (pr.amountCents || 0)
    } else if (pr.status === 'paid') {
      totalCommissionPaid += (pr.amountCents || 0)
    }
  }

  // Get last conversion date
  const lastConv = await payload.find({
    collection: 'affiliate-conversions',
    where: { 
      affiliate: { equals: numericId },
      status: { not_in: ['voided', 'reversed'] }
    },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })
  const lastConversionAt = lastConv.docs[0]?.createdAt || null

  // 4. Update Affiliate record
  await payload.update({
    collection: 'affiliates',
    id: numericId,
    data: {
      totalClicks,
      uniqueClicks,
      totalConversions,
      totalRevenue,
      totalCommissionEarned,
      totalCommissionPending,
      totalCommissionApproved,
      totalCommissionRequested,
      totalCommissionPaid,
      lastClickAt,
      lastConversionAt,
    } as any,
    overrideAccess: true,
  })
}
