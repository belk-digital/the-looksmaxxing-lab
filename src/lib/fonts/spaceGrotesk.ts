import localFont from 'next/font/local'

/**
 * Space Grotesk, SELF-HOSTED (see the note in src/app/fonts.ts for why: the build must never depend on Google Fonts).
 *
 * One shared definition for every page that uses it (shop, cart, checkout, account, affiliate pages...). Use it as
 * `className={spaceGrotesk.className}`. It lives apart from src/app/fonts.ts on purpose: that file is loaded by the root
 * layout, which would send this font to EVERY page; here it is only sent to the pages that import it.
 *
 * The file is the Latin subset of Google's variable font (OFL licence), weights 300-700.
 */
export const spaceGrotesk = localFont({
  src: '../../assets/fonts/space-grotesk-latin.woff2',
  weight: '300 700',
  style: 'normal',
  display: 'swap',
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'sans-serif'],
})
