import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

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
  })

  const affiliate = result.docs[0]
  if (!affiliate || affiliate.status !== 'approved') {
    redirect('/affiliates/dashboard')
  }

  const conversionsRes = await payload.find({
    collection: 'affiliate-conversions',
    where: { affiliate: { equals: affiliate.id } },
    sort: '-createdAt',
  })

  const conversions = conversionsRes.docs

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white">Conversions</h1>
      
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-800 text-xs uppercase text-gray-300">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Order Value</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {conversions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No conversions yet. Share your links to get started!
                  </td>
                </tr>
              ) : (
                conversions.map((conv) => (
                  <tr key={conv.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-6 py-4">{new Date(conv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">${((conv.orderSubtotal || 0) / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 font-medium text-white">${((conv.commissionAmount || 0) / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${conv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : ''}
                        ${conv.status === 'approved' ? 'bg-green-500/10 text-green-500' : ''}
                        ${conv.status === 'paid' ? 'bg-blue-500/10 text-blue-500' : ''}
                        ${['reversed', 'voided'].includes(conv.status || '') ? 'bg-red-500/10 text-red-500' : ''}
                      `}>
                        {conv.status}
                      </span>
                    </td>
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
