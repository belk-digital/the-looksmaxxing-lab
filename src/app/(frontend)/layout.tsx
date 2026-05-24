import '@/app/globals.css'
import { Header } from '@/components/shared/Header'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata = {
  title: 'Looksmaxxing Lab',
  description: 'Premium Peptides for Peak Performance',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <head />
        <body
          className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white antialiased"
          suppressHydrationWarning
        >
          <div className="flex min-h-screen flex-col relative">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
