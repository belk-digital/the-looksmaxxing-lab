import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Package, MapPin, DollarSign, ArrowRight } from 'lucide-react'

export default async function AccountOverviewPage() {
  const user = await getPayloadUser()
  
  if (!user) return null

  const payload = await getPayload({ config })
  
  const orders = await payload.find({
    collection: 'orders',
    where: { owner: { equals: user.id } },
    sort: '-createdAt',
    limit: 3,
    overrideAccess: true,
  })

  // 2. Check if user is an affiliate
  const affiliateQuery = await payload.find({
    collection: 'affiliates',
    where: { user: { equals: user.id } },
    limit: 1,
    overrideAccess: true,
  })
  const affiliate = affiliateQuery.docs[0]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Overview</h2>
        <p className="text-gray-500 dark:text-gray-400">Welcome back, {user.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Orders Summary Card */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-6 w-6 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
          </div>
          
          {orders.docs.length > 0 ? (
            <div className="space-y-3">
              {orders.docs.map(order => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">#{order.orderNumber || order.id}</span>
                  <span className="font-medium text-gray-900 dark:text-white">${((order.total || 0) / 100).toFixed(2)}</span>
                </div>
              ))}
              <Link href="/account/orders" className="mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                View all orders <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              You haven't placed any orders yet.
            </div>
          )}
        </div>

        {/* Affiliate Integration Widget */}
        {affiliate?.status === 'approved' ? (
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-6 dark:border-pink-900/30 dark:bg-pink-900/10">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-6 w-6 text-pink-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Affiliate Partner</h3>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Earned</p>
                <p className="font-bold text-gray-900 dark:text-white">${((affiliate.totalCommissionEarned || 0) / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Clicks</p>
                <p className="font-bold text-gray-900 dark:text-white">{affiliate.totalClicks || 0}</p>
              </div>
            </div>
            <Link 
              href="/affiliates/dashboard" 
              className="inline-flex items-center justify-center rounded bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 transition-colors"
            >
              Go to Affiliate Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Join Our Affiliate Program</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Earn 10% commission on every sale you refer to us. Sign up today and get your custom coupon code!
            </p>
            <Link 
              href="/affiliates/apply" 
              className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Apply Now
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
