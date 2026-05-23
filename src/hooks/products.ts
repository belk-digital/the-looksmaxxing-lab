import { CollectionBeforeChangeHook } from 'payload/types'
import slugify from 'slugify'

export const productsBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  // Ensure slug from English name if not provided
  if (data.name && typeof data.name === 'object' && data.name.en && !data.slug) {
    data.slug = slugify(data.name.en, { lower: true, strict: true })
  }

  // Validate variants when hasVariants is true
  if (data.hasVariants) {
    if (!Array.isArray(data.variants) || data.variants.length === 0) {
      throw new Error('When hasVariants is true, at least one variant is required')
    }
    // Check for duplicate SKUs within this product
    const skuSet = new Set()
    for (const variant of data.variants) {
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
