import '@/app/globals.css'
import { Toaster } from '@/components/ui/sonner'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Sign In | Longevia Research',
    template: '%s | Longevia Research',
  },
  description: 'Sign in or create an account at Longevia Research. Access your orders, manage subscriptions, and explore research-grade peptides.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head />
      <body
        className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white antialiased"
        suppressHydrationWarning
      >
        {children}
        <div className="text-black">
          <Toaster />
        </div>
      </body>
    </html>
  )
}
