import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export default async function AffiliateSettingsPage() {
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
      
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-white">Payout Method</h3>
        <p className="mb-4 text-sm text-gray-400">Configure how you want to receive your commissions.</p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Preferred Currency</label>
            <select 
              defaultValue={affiliate.payoutCurrency || 'USD'}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            >
              <option value="USD">USD</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="USDT_ERC20">USDT (ERC20)</option>
              <option value="USDT_TRC20">USDT (TRC20)</option>
              <option value="STORE_CREDIT">Store Credit</option>
            </select>
          </div>

          <div className="pt-4">
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
