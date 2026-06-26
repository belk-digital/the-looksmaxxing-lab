import '@/app/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Sign In | The Looksmaxxing Lab',
    template: '%s | The Looksmaxxing Lab',
  },
  description: 'Sign in or create an account at The Looksmaxxing Lab. Access your orders, manage subscriptions, and explore research-grade peptides.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <head />
        <body
          className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white antialiased"
          suppressHydrationWarning
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
