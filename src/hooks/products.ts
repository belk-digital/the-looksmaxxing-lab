import type { CollectionBeforeChangeHook, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import slugify from 'slugify'
import { clearCachedPages } from '../lib/cache/clearCachedPages'

export const productsBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  // Ensure slug from English name if not provided
  if (data.name && typeof data.name === 'object' && data.name.en && !data.slug) {
    data.slug = slugify(data.name.en, { lower: true, strict: true })
  }

  // Safely check variants to avoid crashing on partial updates
  const hasVariants = data.hasVariants !== undefined ? data.hasVariants : originalDoc?.hasVariants
  const variants = data.variants !== undefined ? data.variants : originalDoc?.variants

  // Validate variants when hasVariants is true
  if (hasVariants) {
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('When hasVariants is true, at least one variant is required')
    }
    // Check for duplicate SKUs within this product
    const skuSet = new Set()
    for (const variant of variants) {
      if (!variant.sku) {
        throw new Error('Each variant must have a SKU')
      }
      if (skuSet.has(variant.sku)) {
        throw new Error(`Duplicate SKU detected: ${variant.sku}`)
      }
      skuSet.add(variant.sku)
    }
  }

  return data
}

// Pages that are cached for a day and show product data. The product's own page is added per save.
//   /                homepage "best sellers" cards
//   /products        all-products listing
//   /certificates    COA library, built from each product's COA file
const PAGES_SHOWING_PRODUCTS = ['/', '/products', '/certificates']

function productPages(...slugs: Array<string | null | undefined>): string[] {
  return [...slugs.filter(Boolean).map((slug) => `/products/${slug}`), ...PAGES_SHOWING_PRODUCTS]
}

// Saving a product (the Save button in the admin, or code that updates stock/price) clears the cached
// copy of that product's page right away. If the slug was changed, the old address is cleared too.
export const productsAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  clearCachedPages('productsAfterChange', productPages(doc?.slug, previousDoc?.slug))
}

export const productsAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  clearCachedPages('productsAfterDelete', productPages(doc?.slug))
}
