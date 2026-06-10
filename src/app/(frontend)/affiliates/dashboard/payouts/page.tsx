import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { PayoutsClient } from './PayoutsClient'

export const metadata = {
  title: 'Payouts | Affiliate Dashboard',
}

export default async function AffiliatePayoutsPage() {
  const user = await getPayloadUser()
  
  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'affiliates',
    where: { user: { equals: user.id } },
    limit: 1,
    overrideAccess: true,
  })

  const affiliate = result.docs[0]
  if (!affiliate || affiliate.status !== 'approved') {
    redirect('/affiliates/dashboard')
  }

  const payoutsRes = await payload.find({
    collection: 'payout-requests',
    where: { affiliate: { equals: affiliate.id } },
    sort: '-createdAt',
    overrideAccess: true,
  })

  const mappedPayouts = payoutsRes.docs.map(req => ({
    id: String(req.id),
    date: new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    amount: req.amountCents || 0,
    method: req.payoutMethod,
    details: req.payoutDetails,
    status: req.status || 'pending',
  }))

  const totalApproved = affiliate.totalCommissionApproved || 0
  const totalRequested = affiliate.totalCommissionRequested || 0
  const totalPendingHold = affiliate.totalCommissionPending || 0
  const availableBalance = Math.max(0, totalApproved - totalRequested)
  const minimumThreshold = affiliate.minimumPayoutThreshold || 5000 // default $50

  return (
    <PayoutsClient 
      payoutRequests={mappedPayouts} 
      availableBalance={availableBalance}
      totalPendingHold={totalPendingHold}
      minimumThreshold={minimumThreshold}
    />
  )
}
