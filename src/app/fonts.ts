import { Bodoni_Moda, DM_Sans } from 'next/font/google'

export const fontDisplay = Bodoni_Moda({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})

export const fontSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})
