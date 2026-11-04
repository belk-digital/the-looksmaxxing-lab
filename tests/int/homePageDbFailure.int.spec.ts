/**
 * The home page is saved for 2 days. If a database failure were quietly turned into an empty "best sellers"
 * row, that wrong page would be saved and served to everyone for 2 days.
 *
 * What is tested:
 * - A failed product lookup (getShopProducts returns { success: false }) or a thrown error makes the page
 *   throw, so Next.js keeps the last good copy.
 * - A working lookup shows the products; a genuinely empty result still renders.
 *
 * No database: the product loader and the heavy page sections are mocked.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const getShopProducts = vi.hoisted(() => vi.fn())

vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('@/app/(frontend)/(shop)/actions', () => ({
  getShopProducts: (...args: unknown[]) => getShopProducts(...args),
}))
vi.mock('@/components/home/HomePreloaderWrapper', () => ({ HomePreloaderWrapper: ({ children }: any) => children }))
vi.mock('@/components/home/Hero', () => ({ Hero: () => null }))
vi.mock('@/components/home/CategoriesSection', () => ({ CategoriesSection: () => null }))
vi.mock('@/components/home/FeaturedProductsSection', async () => {
  const R = await import('react')
  return {
    FeaturedProductsSection: ({ products }: any) =>
      R.createElement('div', { id: 'featured' }, products.map((p: any) => p.name).join('|')),
  }
})

const loadHome = async () => (await import('../../src/app/(frontend)/page')).default

beforeEach(() => {
  getShopProducts.mockReset()
})

describe('home page when the database fails', () => {
  it('throws when the product lookup reports a failure, instead of rendering an empty best-sellers row', async () => {
    getShopProducts.mockResolvedValue({ success: false, error: 'db down', products: [], totalPages: 0 })
    const Homepage = await loadHome()
    await expect(Homepage()).rejects.toThrow(/featured products.*db down/)
  })

  it('throws when the product lookup itself throws', async () => {
    getShopProducts.mockRejectedValue(new Error('connection reset'))
    const Homepage = await loadHome()
    await expect(Homepage()).rejects.toThrow('connection reset')
  })
})

describe('home page with a working database', () => {
  it('shows the best sellers', async () => {
    getShopProducts.mockResolvedValue({ success: true, products: [{ name: 'BPC-157' }, { name: 'TB-500' }], totalPages: 1 })
    const Homepage = await loadHome()
    expect(renderToStaticMarkup(await Homepage())).toContain('BPC-157|TB-500')
    expect(getShopProducts.mock.calls[0][0]).toMatchObject({ limit: 8, isBestSeller: true })
  })

  it('still renders when there genuinely are no best sellers', async () => {
    getShopProducts.mockResolvedValue({ success: true, products: [], totalPages: 0 })
    const Homepage = await loadHome()
    const page = await Homepage()
    expect(() => renderToStaticMarkup(page)).not.toThrow()
  })
})
