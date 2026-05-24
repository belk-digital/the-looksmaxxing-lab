import Link from 'next/link'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export default async function AffiliateDashboardLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
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

  // If not approved/pending, we still render children which handles the 'not an affiliate' UI
  // But if they are an affiliate, we show the sidebar.

  const navItems = [
    { name: 'Overview', href: '/affiliates/dashboard' },
    { name: 'Links & Creatives', href: '/affiliates/dashboard/links' },
    { name: 'Conversions', href: '/affiliates/dashboard/conversions' },
    { name: 'Payouts', href: '/affiliates/dashboard/payouts' },
    { name: 'Settings', href: '/affiliates/dashboard/settings' },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      {affiliate && affiliate.status === 'approved' && (
        <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
          <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Partner Portal</h2>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  )
}
