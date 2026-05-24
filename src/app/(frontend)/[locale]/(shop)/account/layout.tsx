import Link from 'next/link'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { User, Package, MapPin, Settings, DollarSign } from 'lucide-react'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getPayloadUser()
  
  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })
  
  // Check if user is an approved affiliate to show the menu item
  const affiliateQuery = await payload.find({
    collection: 'affiliates',
    where: { user: { equals: user.id } },
    limit: 1,
    overrideAccess: true,
  })
  
  const affiliate = affiliateQuery.docs[0]
  const isApprovedAffiliate = affiliate?.status === 'approved'

  const navItems = [
    { name: 'Dashboard', href: '/account', icon: User },
    { name: 'Orders', href: '/account/orders', icon: Package },
    { name: 'Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'Settings', href: '/account/settings', icon: Settings },
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Account</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your profile, orders, and settings.</p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <Icon className="h-5 w-5 opacity-70 group-hover:opacity-100" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Conditional Affiliate Link */}
            {isApprovedAffiliate && (
              <>
                <div className="my-2 border-t border-gray-200 dark:border-gray-800"></div>
                <Link
                  href="/affiliates/dashboard"
                  className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-50 hover:text-pink-700 dark:text-pink-400 dark:hover:bg-pink-900/20 dark:hover:text-pink-300"
                >
                  <DollarSign className="h-5 w-5 opacity-70 group-hover:opacity-100" />
                  Affiliate Portal
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
