import '@/app/globals.css'
import { ClerkProvider } from '@clerk/nextjs'

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
