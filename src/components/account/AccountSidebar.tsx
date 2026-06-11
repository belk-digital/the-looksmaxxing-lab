'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Space_Grotesk } from 'next/font/google'
import { LayoutDashboard, Package, MapPin, Heart, Settings, LogOut, Wallet, BarChart3, Users } from 'lucide-react'
import { motion } from 'framer-motion'

import { useClerk } from '@clerk/nextjs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { useState } from 'react'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

const NAV_ITEMS = [
  { name: 'Overview', href: '/account', icon: LayoutDashboard },
  { name: 'Orders', href: '/account/orders', icon: Package },
  { name: 'Addresses', href: '/account/addresses', icon: MapPin },
  { name: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { name: 'Settings', href: '/account/settings', icon: Settings },
]

export function AccountSidebar({ 
  userName = 'User', 
  maxxPoints = 0,
  affiliateStatus = 'none' 
}: { 
  userName?: string
  maxxPoints?: number
  affiliateStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended'
}) {
  const pathname = usePathname() || ''
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  
  return (
    <aside className="w-full h-fit flex flex-col gap-8 lg:sticky lg:top-32 z-10">
      {/* Greeting */}
      <div className="hidden lg:flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Welcome Back</span>
        <h2 className={`text-2xl font-bold text-black tracking-tight ${spaceGrotesk.className}`}>
          {userName}
        </h2>
      </div>

      {/* Maxx Points Widget */}
      <div className="flex flex-col gap-3 bg-white border border-amber-200/60 shadow-sm p-5 rounded-2xl w-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-2 -mr-2 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-amber-500 pointer-events-none">
          <Wallet size={80} />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 shadow-inner border border-amber-100/50">
            <Wallet size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">Maxx Points</span>
            <span className="text-xl font-bold text-black leading-none mt-1">{Number(maxxPoints.toFixed(2))} <span className="text-sm font-medium text-gray-400">(${maxxPoints.toFixed(2)})</span></span>
          </div>
        </div>
        <div className="relative z-10 bg-amber-50/50 rounded-xl p-3.5 border border-amber-100/50 mt-1 shadow-sm">
          <p className="text-[10px] text-amber-800/90 leading-relaxed font-medium">
            <strong className="text-amber-900 font-bold">1 Point = $1.</strong> Your points can be applied as a discount directly at checkout.
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2 pb-4 lg:pb-0">
        {NAV_ITEMS.map((item) => {
          // Strict exact match for root /account
          const isActive = item.href === '/account' 
            ? pathname.endsWith('/account') 
            : pathname.includes(item.href)

          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center justify-center lg:justify-start gap-3 shrink-0 px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300
                ${isActive 
                  ? 'text-white' 
                  : 'text-gray-500 hover:text-black hover:bg-black/5 bg-gray-50 lg:bg-transparent'
                }
              `}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 bg-black rounded-2xl z-0 shadow-md shadow-black/10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={16} className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-black'}`} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          )
        })}

        {/* Affiliate Link (if approved) */}
        {affiliateStatus === 'approved' && (
          <Link
            href="/affiliates/dashboard"
            className="relative flex items-center justify-center lg:justify-start gap-3 shrink-0 px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 text-[#5984c4] hover:bg-blue-50/50 bg-blue-50 lg:bg-transparent group"
          >
            <BarChart3 size={16} className="relative z-10 transition-colors duration-300 text-[#5984c4] group-hover:text-blue-600" />
            <span className="relative z-10 group-hover:text-blue-600">Affiliate Dashboard</span>
          </Link>
        )}
        
        <div className="hidden lg:block w-full h-px bg-gray-200 my-4" />
        
        {/* Sign out */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center justify-center lg:justify-start gap-3 shrink-0 px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.15em] text-red-500 hover:text-white hover:bg-red-500 transition-all duration-300 group bg-red-50 lg:bg-transparent">
              <LogOut size={16} className="text-red-400 group-hover:text-white transition-colors duration-300" />
              <span className="relative z-10">Sign out</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white border border-gray-100 p-8 rounded-3xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className={`text-2xl font-bold tracking-tight text-black ${spaceGrotesk.className}`}>
                Sign Out
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-2">
                Are you sure you want to sign out of your account?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 sm:justify-end">
              <DialogClose asChild>
                <button className="px-6 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] text-black bg-gray-100 hover:bg-gray-200 transition-colors w-full sm:w-auto text-center">
                  Cancel
                </button>
              </DialogClose>
              <button 
                onClick={() => signOut({ redirectUrl: '/' })}
                className="px-6 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md w-full sm:w-auto text-center"
              >
                Yes, Sign Out
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </nav>

      {/* Promotional Affiliate Box if not affiliate */}
      {affiliateStatus === 'none' && (
        <div className="hidden lg:flex flex-col gap-3 mt-4 bg-gradient-to-br from-[#f8faff] to-[#eef4ff] border border-blue-100/50 shadow-sm p-5 rounded-2xl w-full relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-blue-500 pointer-events-none">
            <Users size={80} />
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5984c4]">Partner Program</span>
            <p className="text-[11px] text-blue-900/80 leading-relaxed font-medium">
              Earn <strong className="text-blue-900 font-bold">15% commission</strong> by referring researchers.
            </p>
          </div>
          <Link href="/affiliates" className="relative z-10 mt-2 bg-white text-[#5984c4] hover:bg-blue-50 hover:text-blue-600 border border-blue-100 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 text-center shadow-sm">
            Apply Now
          </Link>
        </div>
      )}
      
      {affiliateStatus === 'pending' && (
        <div className="hidden lg:flex flex-col gap-3 mt-4 bg-gray-50 border border-gray-200/50 shadow-sm p-5 rounded-2xl w-full relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">Partner Program</span>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
              Your application is currently under review.
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
