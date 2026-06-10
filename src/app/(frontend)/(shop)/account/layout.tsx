import React from 'react'
import { Container } from '@/components/ui/container'
import { AccountSidebar } from '@/components/account/AccountSidebar'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'

export const metadata = {
  title: 'My Account | The Looksmaxxing Lab',
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getPayloadUser()
  const userName = user?.firstName || user?.email?.split('@')[0] || 'User'
  const maxxPoints = user?.maxxPoints || 0

  let affiliateStatus: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended' = 'none'
  if (user) {
    const payload = await getPayload({ config })
    const { docs: affiliates } = await payload.find({
      collection: 'affiliates',
      where: { user: { equals: user.id } },
      limit: 1,
      overrideAccess: true,
    })
    if (affiliates.length > 0) {
      affiliateStatus = affiliates[0].status || 'pending'
    }
  }

  return (
    <div className="pt-20 bg-[#FAFAFA] min-h-screen selection:bg-black/10">
      <Container size="page" className="py-12 md:py-16">
        <h1 className={`text-4xl md:text-5xl font-bold tracking-tighter text-black mb-12 drop-shadow-sm ${spaceGrotesk.className}`}>
          My Account
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12 lg:gap-20">
          <div className="h-full relative">
            <AccountSidebar userName={userName} maxxPoints={maxxPoints} affiliateStatus={affiliateStatus} />
          </div>
          <div className="w-full">
            {children}
          </div>
        </div>
      </Container>
    </div>
  )
}
