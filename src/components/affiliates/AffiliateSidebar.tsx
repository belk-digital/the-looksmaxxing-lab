'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Space_Grotesk } from 'next/font/google'
import { LayoutDashboard, Link as LinkIcon, Target, DollarSign, WalletCards, Settings, LogOut, Medal } from 'lucide-react'
import { motion } from 'framer-motion'

import { useClerk } from '@clerk/nextjs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { useState } from 'react'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

const NAV_ITEMS = [
  { name: 'Overview', href: '/affiliates/dashboard', icon: LayoutDashboard },
  { name: 'Links & Assets', href: '/affiliates/dashboard/links', icon: LinkIcon },
  { name: 'Conversions', href: '/affiliates/dashboard/conversions', icon: Target },
  { name: 'Payouts', href: '/affiliates/dashboard/payouts', icon: WalletCards },
  { name: 'Settings', href: '/affiliates/dashboard/settings', icon: Settings },
]

export function AffiliateSidebar({ 
  userName = 'Partner', 
  tier = 'standard'
}: { 
  userName?: string
  tier?: string
}) {
  const pathname = usePathname() || ''
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  
  return (
    <aside className="w-full h-fit flex flex-col gap-8 lg:sticky lg:top-32 z-10">
      {/* Greeting */}
      <div className="hidden lg:flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Affiliate Dashboard</span>
        <h2 className={`text-2xl font-bold text-black tracking-tight ${spaceGrotesk.className}`}>
          {userName}
        </h2>
      </div>

      {/* Tier Widget */}
      <div className="flex flex-col gap-3 bg-gradient-to-br from-[#f8faff] to-[#eef4ff] border border-blue-200/60 shadow-sm p-5 rounded-2xl w-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-2 -mr-2 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-blue-500 pointer-events-none">
          <Medal size={80} />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-inner border border-blue-200/50">
            <Medal size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-500">Current Status</span>
            <span className="text-xl font-bold text-[#5984c4] leading-none mt-1 capitalize">{tier} Tier</span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2 pb-4 lg:pb-0">
        {NAV_ITEMS.map((item) => {
          // Strict exact match for root /dashboard
          const isActive = item.href === '/affiliates/dashboard' 
            ? pathname.endsWith('/dashboard') 
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
                  layoutId="affiliate-active-pill"
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

        {/* Back to Shop Link */}
        <Link
          href="/account"
          className="relative flex items-center justify-center lg:justify-start gap-3 shrink-0 px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 text-gray-500 hover:bg-gray-100 bg-transparent group mt-2"
        >
          <span className="relative z-10 group-hover:text-black">&larr; Back to Account</span>
        </Link>
        
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
    </aside>
  )
}
