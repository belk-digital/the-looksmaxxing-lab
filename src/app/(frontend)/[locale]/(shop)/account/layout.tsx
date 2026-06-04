import React from 'react'
import { Container } from '@/components/ui/container'
import { AccountSidebar } from '@/components/account/AccountSidebar'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

import { getPayloadUser } from '@/lib/auth/getPayloadUser'

export const metadata = {
  title: 'My Account | The Looksmaxxing Lab',
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getPayloadUser()
  const userName = user?.firstName || user?.email?.split('@')[0] || 'User'
  const purityPoints = user?.purityPoints || 0

  return (
    <div className="pt-20 bg-[#FAFAFA] min-h-screen selection:bg-black/10">
      <Container size="page" className="py-12 md:py-16">
        <h1 className={`text-4xl md:text-5xl font-bold tracking-tighter text-black mb-12 drop-shadow-sm ${spaceGrotesk.className}`}>
          My Account
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12 lg:gap-20">
          <div className="h-full relative">
            <AccountSidebar userName={userName} purityPoints={purityPoints} />
          </div>
          <div className="w-full">
            {children}
          </div>
        </div>
      </Container>
    </div>
  )
}
