import '@/app/globals.css'

export const metadata = {
  title: 'Payload Blank Template',
  description: 'A blank template using Payload in a Next.js app.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
