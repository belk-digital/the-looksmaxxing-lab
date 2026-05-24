import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

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
  })

  const affiliate = result.docs[0]
  if (!affiliate || affiliate.status !== 'approved') {
    redirect('/affiliates/dashboard')
  }

  const payoutsRes = await payload.find({
    collection: 'affiliate-payouts',
    where: { affiliate: { equals: affiliate.id } },
    sort: '-createdAt',
  })

  const payouts = payoutsRes.docs

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white">Payouts</h1>
      
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-800 text-xs uppercase text-gray-300">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No payouts yet. Keep earning!
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-6 py-4">{new Date(payout.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-white">${((payout.totalAmountCents || 0) / 100).toFixed(2)} {payout.currency}</td>
                    <td className="px-6 py-4">{payout.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${payout.status === 'processing' ? 'bg-yellow-500/10 text-yellow-500' : ''}
                        ${payout.status === 'paid' ? 'bg-green-500/10 text-green-500' : ''}
                        ${payout.status === 'failed' ? 'bg-red-500/10 text-red-500' : ''}
                        ${payout.status === 'draft' ? 'bg-gray-500/10 text-gray-400' : ''}
                      `}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{payout.transactionId || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
