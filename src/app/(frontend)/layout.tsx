import '@/app/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { fontDisplay, fontSans } from '@/app/fonts'
import { LayoutClientWrapper } from '@/components/shared/LayoutClientWrapper'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { SmoothScroll } from '@/components/shared/SmoothScroll'
import { Toaster } from '@/components/ui/sonner'
import { GlobalNavigationSpinner } from '@/components/shared/GlobalNavigationSpinner'

export const metadata = {
  title: 'Looksmaxxing Lab',
  description: 'Premium Peptides for Peak Performance',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`min-h-screen ${fontDisplay.variable} ${fontSans.variable}`} suppressHydrationWarning>
        <head />
        <body
          className="min-h-screen bg-cream text-ink antialiased"
          suppressHydrationWarning
        >
          <GlobalNavigationSpinner />
          <SmoothScroll>
            <LayoutClientWrapper header={<Header />} footer={<Footer />}>
              {children}
            </LayoutClientWrapper>
            <Toaster />
          </SmoothScroll>
        </body>
      </html>
    </ClerkProvider>
  )
}
