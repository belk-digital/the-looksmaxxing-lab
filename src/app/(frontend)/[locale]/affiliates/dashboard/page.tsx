import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AffiliateDashboardPage() {
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

  if (!affiliate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Join our Affiliate Program</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          You are not currently registered as an affiliate. Apply today to start earning commissions!
        </p>
        <Link href="/affiliates/apply" className="mt-6 rounded bg-primary px-6 py-2 text-white hover:bg-primary/90 transition-colors">
          Apply Now
        </Link>
      </div>
    )
  }

  if (affiliate.status === 'pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Pending</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Your affiliate application is currently under review by our team. We'll notify you via email once it's approved.
        </p>
      </div>
    )
  }

  if (affiliate.status !== 'approved') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900 text-center">
        <h1 className="text-2xl font-bold text-red-600">Account {affiliate.status}</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Your affiliate account has been {affiliate.status}. Please contact support if you believe this is an error.
        </p>
      </div>
    )
  }

  // Dashboard Overview
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Clicks</h3>
          </div>
          <div className="text-2xl font-bold text-white">{affiliate.totalClicks || 0}</div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-400">Conversions</h3>
          </div>
          <div className="text-2xl font-bold text-white">{affiliate.totalConversions || 0}</div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-400">Pending Earnings</h3>
          </div>
          <div className="text-2xl font-bold text-white">${((affiliate.totalCommissionPending || 0) / 100).toFixed(2)}</div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-400">Approved for Payout</h3>
          </div>
          <div className="text-2xl font-bold text-green-500">${((affiliate.totalCommissionApproved || 0) / 100).toFixed(2)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-white">Your Referral Link</h3>
        <div className="flex items-center space-x-2">
          <code className="flex-1 rounded bg-gray-800 px-4 py-3 text-sm text-gray-300 overflow-x-auto">
            {process.env.NEXT_PUBLIC_SERVER_URL}/ref/{affiliate.referralSlug}
          </code>
        </div>
      </div>
    </div>
  )
}
