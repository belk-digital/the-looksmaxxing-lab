import { CollectionBeforeChangeHook } from 'payload'

export const couponsHook: CollectionBeforeChangeHook = async ({ data, originalDoc, operation }) => {
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

  // Advanced validations
  // minSpend must be non-negative
  if (typeof data?.minSpend !== 'undefined' && data.minSpend < 0) {
    throw new Error('minSpend must be a non-negative number')
  }
  // usageLimit must be positive if set
  if (typeof data?.usageLimit !== 'undefined' && data.usageLimit <= 0) {
    throw new Error('usageLimit must be greater than zero')
  }
  // expiresAt must be a future date if provided
  if (data?.expiresAt) {
    const expires = new Date(data.expiresAt)
    if (isNaN(expires.getTime())) {
      throw new Error('expiresAt must be a valid date')
    }
    if (expires <= new Date()) {
      throw new Error('expiresAt must be a future date')
    }
  }
  // Store credit handling
  if (data?.type === 'store_credit') {
    if (typeof data?.storeCreditAmount !== 'number') {
      throw new Error('storeCreditAmount is required for store credit coupons')
    }
    // Initialize remainingBalance on create
    if (operation === 'create') {
      data.remainingBalance = data.storeCreditAmount
    }
  }
  // Prevent manual modification of remainingBalance on update
  if (operation === 'update' && typeof data?.remainingBalance !== 'undefined') {
    delete data.remainingBalance
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
