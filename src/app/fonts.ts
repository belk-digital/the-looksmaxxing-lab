import localFont from 'next/font/local'

/**
 * The site's two main fonts, SELF-HOSTED (the files are in src/assets/fonts).
 *
 * They used to be loaded with next/font/google, which downloads the fonts from Google while the site is being built.
 * Google sometimes answers with font links that Next.js 16.2 cannot read ("TypeError: Cannot read properties of null
 * (reading '1')" in next/font), and that failed a production build even though nothing in the code had changed. With
 * the files in the repository the build never asks Google for anything, so it cannot fail (or slow down) that way.
 *
 * The files are the Latin subset of Google's variable fonts (OFL licence), so every Latin letter, digit and punctuation
 * mark looks exactly as before. One weight range per file: Bodoni Moda 400-800, DM Sans 400-700.
 * The CSS variable names are unchanged (--font-display, --font-sans), so Tailwind's font-display / font-sans still work.
 *
 * Space Grotesk (used in the shop and account pages) is in src/lib/fonts/spaceGrotesk.ts, so it is only sent to the
 * pages that use it.
 */
export const fontDisplay = localFont({
  src: '../assets/fonts/bodoni-moda-latin.woff2',
  weight: '400 800',
  style: 'normal',
  display: 'swap',
  variable: '--font-display',
  // While the font loads, show a Times New Roman sized to match it, so the text does not jump when it arrives.
  adjustFontFallback: 'Times New Roman',
  fallback: ['serif'],
})

export const fontSans = localFont({
  src: '../assets/fonts/dm-sans-latin.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-sans',
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'sans-serif'],
})
