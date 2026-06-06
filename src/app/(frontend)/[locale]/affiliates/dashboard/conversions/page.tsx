import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ConversionsClient } from './ConversionsClient'

export const metadata = {
  title: 'Conversions | Affiliate Dashboard',
}

export default async function AffiliateConversionsPage() {
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

  const conversionsRes = await payload.find({
    collection: 'affiliate-conversions',
    where: { affiliate: { equals: affiliate.id } },
    sort: '-createdAt',
    overrideAccess: true,
  })

  const mappedConversions = conversionsRes.docs.map(conv => ({
    id: String(conv.id),
    date: new Date(conv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    orderValue: conv.orderSubtotal || 0,
    commissionAmount: conv.commissionAmount || 0,
    status: conv.status || 'pending',
  }))

  return (
    <ConversionsClient conversions={mappedConversions} />
  )
}
