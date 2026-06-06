import React from 'react'
import { redirect } from 'next/navigation'
import { Container } from '@/components/ui/container'
import { AffiliateSidebar } from '@/components/affiliates/AffiliateSidebar'
import { Space_Grotesk } from 'next/font/google'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export const metadata = {
  title: 'Affiliate Dashboard | The Looksmaxxing Lab',
}

export default async function AffiliateDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getPayloadUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config })
  
  // Fetch Affiliate Data
  const { docs: affiliates } = await payload.find({
    collection: 'affiliates',
    where: { user: { equals: user.id } },
    limit: 1,
    overrideAccess: true,
  })

  // If no affiliate record or not approved, redirect to apply
  if (affiliates.length === 0 || affiliates[0].status !== 'approved') {
    redirect('/affiliates')
  }

  const affiliate = affiliates[0]
  const userName = affiliate.displayName || user?.firstName || user?.email?.split('@')[0] || 'Partner'
  const tier = affiliate.tier || 'standard'

  return (
    <div className="pt-20 bg-[#FAFAFA] min-h-screen selection:bg-black/10">
      <Container size="page" className="py-12 md:py-16">
        <h1 className={`text-4xl md:text-5xl font-bold tracking-tighter text-black mb-12 drop-shadow-sm ${spaceGrotesk.className}`}>
          Affiliate Dashboard
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12 lg:gap-20">
          <div className="h-full relative">
            <AffiliateSidebar userName={userName} tier={tier} />
          </div>
          <div className="w-full">
            {children}
          </div>
        </div>
      </Container>
    </div>
  )
}
