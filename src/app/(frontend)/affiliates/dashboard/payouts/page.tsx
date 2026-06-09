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
    collection: 'affiliate-payouts',
    where: { affiliate: { equals: affiliate.id } },
    sort: '-createdAt',
    overrideAccess: true,
  })

  const mappedPayouts = payoutsRes.docs.map(payout => ({
    id: String(payout.id),
    date: new Date(payout.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    amount: payout.totalAmountCents || 0,
    currency: payout.currency || 'USD',
    method: payout.paymentMethod || 'paypal',
    status: payout.status || 'draft',
    reference: payout.transactionId || '',
  }))

  const availableBalance = affiliate.totalCommissionApproved || 0
  const minimumThreshold = affiliate.minimumPayoutThreshold || 5000 // default $50

  const hasPendingRequest = payoutsRes.docs.some(
    p => p.status === 'draft' || p.status === 'processing'
  )

  return (
    <PayoutsClient 
      payouts={mappedPayouts} 
      availableBalance={availableBalance}
      minimumThreshold={minimumThreshold}
      hasPendingRequest={hasPendingRequest}
    />
  )
}
