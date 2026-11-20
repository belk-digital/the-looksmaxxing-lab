/**
 * The site's fonts are shipped with the code (src/assets/fonts), not downloaded from Google while the site is built.
 *
 * Why: next/font/google asks Google for the fonts at build time, and Google sometimes answers with font links that
 * Next.js 16.2 cannot read ("TypeError: Cannot read properties of null (reading '1')"), which failed a production build
 * although no font code had changed. (About 1 request in 7 for Bodoni Moda came back in that form when it was measured.)
 *
 * What is tested (no browser, no network):
 * - Nothing in the code imports next/font/google, so a build can never fail or slow down on Google Fonts again.
 * - The three font files exist, are genuine woff2 files and are a sensible size.
 * - Every font definition points at a file that exists; the CSS variable names the styles rely on are unchanged.
 * - Space Grotesk is ONE shared definition, kept out of the root layout's font file (so it is not sent to every page).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')

const sourceFiles = (dir: string): string[] =>
  readdirSync(path.join(root, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`
    const stat = statSync(path.join(root, rel))
    if (stat.isDirectory()) return name === 'node_modules' ? [] : sourceFiles(rel)
    return /\.(ts|tsx)$/.test(name) ? [rel] : []
  })

const FONT_FILES = ['bodoni-moda-latin.woff2', 'dm-sans-latin.woff2', 'space-grotesk-latin.woff2']

describe('no font is downloaded from Google at build time', () => {
  it('no file in src imports next/font/google', () => {
    const offenders = sourceFiles('src').filter((file) => /from\s+['"]next\/font\/google['"]/.test(read(file)))
    expect(offenders).toEqual([])
  })

  it('nothing in the code builds a font with Space_Grotesk(), Bodoni_Moda() or DM_Sans() any more', () => {
    const offenders = sourceFiles('src').filter((file) => /\b(Space_Grotesk|Bodoni_Moda|DM_Sans)\s*\(/.test(read(file)))
    expect(offenders).toEqual([])
  })
})

describe('the font files', () => {
  for (const name of FONT_FILES) {
    it(`${name} is a genuine woff2 file of a sensible size`, () => {
      const file = path.join(root, 'src/assets/fonts', name)
      expect(existsSync(file)).toBe(true)
      const bytes = readFileSync(file)
      expect(bytes.subarray(0, 4).toString('latin1')).toBe('wOF2') // the woff2 signature
      expect(bytes.length).toBeGreaterThan(10_000) // not an error page saved by mistake
      expect(bytes.length).toBeLessThan(150_000) // a Latin subset, not a whole family
    })
  }
})

describe('the font definitions', () => {
  const display = read('src/app/fonts.ts')
  const grotesk = read('src/lib/fonts/spaceGrotesk.ts')

  it('use next/font/local and point at files that exist', () => {
    for (const [source, file] of [[display, 'src/app'], [grotesk, 'src/lib/fonts']] as const) {
      expect(source).toMatch(/from 'next\/font\/local'/)
      const paths = [...source.matchAll(/src:\s*'([^']+\.woff2)'/g)].map((m) => m[1])
      expect(paths.length).toBeGreaterThan(0)
      for (const relative of paths) expect(existsSync(path.join(root, file, relative)), `${file}/${relative}`).toBe(true)
    }
    expect([...display.matchAll(/src:\s*'([^']+)'/g)].length).toBe(2) // display + sans
    expect(display).toContain('bodoni-moda-latin.woff2')
    expect(display).toContain('dm-sans-latin.woff2')
    expect(grotesk).toContain('space-grotesk-latin.woff2')
  })

  it('keep the CSS variable names (and weight ranges) the styles depend on', () => {
    expect(display).toContain("variable: '--font-display'")
    expect(display).toContain("variable: '--font-sans'")
    expect(display).toContain("weight: '400 800'") // Bodoni Moda as before: 400-800
    expect(display).toContain("weight: '400 700'") // DM Sans as before: 400-700
    expect(grotesk).toContain("weight: '300 700'") // Space Grotesk covers the 300/400/500/700 the pages use
    // Tailwind and the login popup read these variables
    expect(read('tailwind.config.ts')).toContain('var(--font-display)')
    expect(read('tailwind.config.ts')).toContain('var(--font-sans)')
    expect(read('src/components/shared/LoginPromptModal.tsx')).toContain('var(--font-display)')
  })

  it('the root layout still puts both variables on the page', () => {
    const layout = read('src/app/(frontend)/layout.tsx')
    expect(layout).toContain("import { fontDisplay, fontSans } from '@/app/fonts'")
    expect(layout).toMatch(/\$\{fontDisplay\.variable\}\s*\$\{fontSans\.variable\}/)
  })

  it('Space Grotesk is kept out of the root layout font file, so it is not sent to every page', () => {
    const code = display.replace(/\/\*[\s\S]*?\*\//g, '') // ignore the explanatory comment, which names the other file
    expect(code).not.toContain('space-grotesk')
    expect(code).not.toContain('spaceGrotesk')
    expect(read('src/app/(frontend)/layout.tsx')).not.toContain('spaceGrotesk')
  })
})

describe('Space Grotesk is one shared definition', () => {
  const users = sourceFiles('src').filter((file) => /\bspaceGrotesk\.className\b/.test(read(file)) && file !== 'src/lib/fonts/spaceGrotesk.ts')

  it('is used on the shop, account and affiliate pages', () => {
    expect(users.length).toBeGreaterThanOrEqual(20)
  })

  it('every page that uses it imports the shared one instead of making its own', () => {
    for (const file of users) {
      const source = read(file)
      expect(source, file).toContain("import { spaceGrotesk } from '@/lib/fonts/spaceGrotesk'")
      expect(source, file).not.toMatch(/const spaceGrotesk\s*=/)
    }
  })
})
