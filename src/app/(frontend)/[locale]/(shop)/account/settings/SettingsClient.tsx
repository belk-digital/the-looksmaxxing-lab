'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExternalLink, Shield, Save, Bell, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { Space_Grotesk } from 'next/font/google'
import { toast } from 'sonner'
import { UpdatePasswordDialog } from '@/components/account/SecurityDialogs'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export interface AccountSettingsProps {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
  }
}

export function SettingsClient({ user }: AccountSettingsProps) {
  const [isPending, startTransition] = React.useTransition()
  const [marketingEmails, setMarketingEmails] = React.useState(true)
  const [orderSms, setOrderSms] = React.useState(true)
  
  // Custom dialog states
  const [passwordOpen, setPasswordOpen] = React.useState(false)

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const { updateProfile } = await import('./actions')
        const result = await updateProfile(formData)
        if (!result?.success) {
          toast.error(result?.error || 'Failed to update profile')
          return
        }
        toast.success('Profile updated successfully')
      } catch (error: any) {
        toast.error(error.message || 'An unexpected error occurred')
      }
    })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col w-full max-w-4xl"
    >
      
      {/* Header */}
      <div className="flex flex-col gap-2 mb-10 border-b border-gray-200 pb-6">
        <h1 className={`text-4xl text-black font-bold tracking-tighter ${spaceGrotesk.className}`}>
          Account Settings
        </h1>
        <p className="text-sm text-gray-500">Manage your personal information, security preferences, and notifications.</p>
      </div>

      <div className="flex flex-col gap-10">
        
        {/* Personal Info Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Shield size={14} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-black">Personal Information</h2>
          </div>
          
          <form action={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName" className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">First Name</Label>
                <Input name="firstName" id="firstName" defaultValue={user.firstName || ''} className="h-12 bg-gray-50 border-gray-100 focus:border-black focus:ring-black rounded-xl" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName" className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">Last Name</Label>
                <Input name="lastName" id="lastName" defaultValue={user.lastName || ''} className="h-12 bg-gray-50 border-gray-100 focus:border-black focus:ring-black rounded-xl" />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="phone" className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">Phone Number</Label>
                <Input name="phone" id="phone" type="tel" defaultValue={user.phone || ''} className="h-12 bg-gray-50 border-gray-100 focus:border-black focus:ring-black rounded-xl" />
              </div>
              <div className="md:col-span-2 mt-4">
                <button disabled={isPending} className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white rounded-full px-8 py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all shadow-lg disabled:opacity-50">
                  <Save size={16} />
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </motion.section>

        {/* Sign In & Security */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Shield size={14} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-black">Sign In & Security</h2>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl flex flex-col gap-8 relative overflow-hidden group">
            
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-12 h-12 bg-white rounded-full border border-gray-100 text-black flex items-center justify-center shadow-sm shrink-0">
                <Shield size={20} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-black tracking-wide">Authentication managed securely</span>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your email (<strong className="text-black font-semibold">{user.email}</strong>) and password are encrypted and managed securely via our authentication provider. 
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <button 
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-black hover:text-white border border-gray-200 hover:border-black text-black rounded-full px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors w-full sm:w-auto shadow-sm"
              >
                Update Password <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Preferences */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Globe size={14} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-black">Preferences</h2>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <Label htmlFor="language" className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language" className="h-12 bg-gray-50 border-gray-100 focus:border-black focus:ring-black rounded-xl text-sm font-medium">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                    <SelectItem value="en" className="rounded-lg">English (US)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="currency" className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger id="currency" className="h-12 bg-gray-50 border-gray-100 focus:border-black focus:ring-black rounded-xl text-sm font-medium">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                    <SelectItem value="usd" className="rounded-lg">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Bell size={14} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-black">Notifications</h2>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl flex flex-col gap-8">
            
            <div className="flex items-center justify-between gap-6 group hover:bg-gray-50 -mx-4 p-4 rounded-2xl transition-colors">
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-sm font-bold text-black">Marketing Emails</span>
                <span className="text-xs text-gray-500">Receive updates on new products, research, and exclusive sales.</span>
              </div>
              <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200 shadow-inner shrink-0 relative z-10">
                <button 
                  type="button" 
                  onClick={() => setMarketingEmails(true)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] rounded-full transition-all ${marketingEmails ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  On
                </button>
                <button 
                  type="button" 
                  onClick={() => setMarketingEmails(false)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] rounded-full transition-all ${!marketingEmails ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Off
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-6 group hover:bg-gray-50 -mx-4 p-4 rounded-2xl transition-colors border-t border-gray-50 pt-8">
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-sm font-bold text-black">Order SMS Updates</span>
                <span className="text-xs text-gray-500">Get real-time text messages about your order shipments and deliveries.</span>
              </div>
              <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200 shadow-inner shrink-0 relative z-10">
                <button 
                  type="button" 
                  onClick={() => setOrderSms(true)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] rounded-full transition-all ${orderSms ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  On
                </button>
                <button 
                  type="button" 
                  onClick={() => setOrderSms(false)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] rounded-full transition-all ${!orderSms ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Off
                </button>
              </div>
            </div>

          </div>
        </motion.section>

      </div>

      <UpdatePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </motion.div>
  )
}
