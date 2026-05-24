// src/app/layout.tsx

/**
 * Root layout for the Next.js 15+ App Router.
 * Provides the required <html> and <body> tags.
 * Sets a dark‑mode‑first background and applies the global Tailwind CSS.
 */
export const metadata = {
  title: 'Lookmaxxing Lab',
  description: 'Peptides e‑commerce platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head />
      <body
        className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
