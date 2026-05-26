import React from 'react'
import { Container } from '@/components/ui/container'
import { AccountSidebar } from '@/components/account/AccountSidebar'

export const metadata = {
  title: 'My Account | The Looksmaxxing Lab',
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // In the future, fetch user profile from Clerk/Payload
  const mockUserName = 'Alex'

  return (
    <div className="pt-20">
      <Container size="page" className="py-12 md:py-16">
        <h1 className="text-display-md font-display text-ink mb-12">My Account</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 lg:gap-16 items-start">
          <AccountSidebar userName={mockUserName} />
          <div className="w-full">
            {children}
          </div>
        </div>
      </Container>
    </div>
  )
}
