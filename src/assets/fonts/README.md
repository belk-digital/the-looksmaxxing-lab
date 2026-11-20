# Self-hosted fonts

These are the **Latin subset** of three Google Fonts, as variable fonts in woff2 format. They are loaded with
`next/font/local` in `src/app/fonts.ts` and `src/lib/fonts/spaceGrotesk.ts`.

| File | Family | Weights | Used for |
| --- | --- | --- | --- |
| `bodoni-moda-latin.woff2` | Bodoni Moda | 400-800 | headings (`font-display`) |
| `dm-sans-latin.woff2` | DM Sans | 400-700 | body text (`font-sans`) |
| `space-grotesk-latin.woff2` | Space Grotesk | 300-700 | shop, cart, checkout, account and affiliate pages |

Why they are here and not loaded from Google: `next/font/google` downloads the fonts at build time, and Google
sometimes answers with links Next.js 16.2 cannot read, which failed a production build ("Cannot read properties of null
(reading '1')"). With the files in the repository the build never contacts Google.

All three fonts are licensed under the SIL Open Font License 1.1 (https://openfontlicense.org), which allows
self-hosting and redistribution.

**Updating or adding a font:** download the woff2 file from Google Fonts (`https://fonts.googleapis.com/css2?family=...`
with a recent Chrome user agent, take the file listed under `/* latin */`), save it here and point `localFont({ src })` at it.
Characters outside basic Latin (for example ≥ → Greek letters) are not in these files; the browser shows them in the
fallback font, exactly as it already did for DM Sans and Space Grotesk.
