import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export default async function AffiliateLinksPage() {
  const user = await getPayloadUser()
  
  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'affiliates',
    where: { user: { equals: user.id } },
    limit: 1,
  })

  const affiliate = result.docs[0]
  if (!affiliate || affiliate.status !== 'approved') {
    redirect('/affiliates/dashboard')
  }

  const referralLink = `${process.env.NEXT_PUBLIC_SERVER_URL}/ref/${affiliate.referralSlug}`

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white">Links & Creatives</h1>
      
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-medium text-white">Your Standard Referral Link</h3>
        <p className="mb-4 text-sm text-gray-400">Share this link. Anyone who clicks it will be tracked as your referral.</p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded border border-gray-700 bg-gray-800 px-4 py-2 text-white"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-medium text-white">Your Custom Coupon Code</h3>
        <p className="mb-4 text-sm text-gray-400">
          Share this coupon code with your audience. They get {affiliate.customerDiscount}% off, and you earn {affiliate.commissionRate}% commission.
        </p>
        <div className="inline-block rounded border border-gray-700 bg-gray-800 px-6 py-3">
          <span className="text-xl font-bold tracking-widest text-primary">{affiliate.couponCode}</span>
        </div>
      </div>
    </div>
  )
}
