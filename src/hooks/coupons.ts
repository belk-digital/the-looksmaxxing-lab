import { BeforeChangeHook } from 'payload/types'

export const couponsHook: BeforeChangeHook = async ({ data, originalDoc, operation }) => {
  // Ensure code is uppercase
  if (data?.code && typeof data.code === 'string') {
    data.code = data.code.toUpperCase()
  }

  // Validation for appliesTo
  const appliesTo = data?.appliesTo
  if (appliesTo === 'specific_products') {
    if (!Array.isArray(data?.products) || data.products.length === 0) {
      throw new Error('When appliesTo is specific_products, products array must not be empty')
    }
  }
  if (appliesTo === 'specific_categories') {
    if (!Array.isArray(data?.categories) || data.categories.length === 0) {
      throw new Error('When appliesTo is specific_categories, categories array must not be empty')
    }
  }

  // Validation for type/value
  const type = data?.type
  const value = data?.value
  if (type === 'percentage') {
    if (typeof value !== 'number' || value < 0 || value > 100) {
      throw new Error('Percentage coupon value must be between 0 and 100')
    }
  }

  // usageCount should not be manually set on create/update
  if (operation === 'create' && data?.usageCount && data.usageCount !== 0) {
    data.usageCount = 0
  }
  if (operation === 'update' && typeof data?.usageCount !== 'undefined') {
    // prevent manual change
    delete data.usageCount
  }

  return data
}
