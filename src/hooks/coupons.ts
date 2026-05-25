import { CollectionBeforeChangeHook } from 'payload'

export const couponsHook: CollectionBeforeChangeHook = async ({ data, originalDoc, operation }) => {
  // Merge incoming data with the original document to safely validate partial updates
  const doc = { ...originalDoc, ...data }

  // Ensure code is uppercase
  if (data?.code && typeof data.code === 'string') {
    data.code = data.code.toUpperCase()
  }

  // Validation for appliesTo
  const appliesTo = doc?.appliesTo
  if (appliesTo === 'specific_products') {
    if (!Array.isArray(doc?.products) || doc.products.length === 0) {
      throw new Error('When appliesTo is specific_products, products array must not be empty')
    }
  }
  if (appliesTo === 'specific_categories') {
    if (!Array.isArray(doc?.categories) || doc.categories.length === 0) {
      throw new Error('When appliesTo is specific_categories, categories array must not be empty')
    }
  }

  // Validation for type/value
  const type = doc?.type
  const value = doc?.value
  if (type === 'percentage') {
    if (typeof value !== 'number' || value < 0 || value > 100) {
      throw new Error('Percentage coupon value must be between 0 and 100')
    }
  }

  // Advanced validations - carefully handling empty strings and nulls
  if (data?.minSpend !== undefined) {
    if (data.minSpend === '' || data.minSpend === null) {
      data.minSpend = null // Normalize empty inputs
    } else {
      const min = Number(data.minSpend)
      if (isNaN(min) || min < 0) {
        throw new Error('minSpend must be a non-negative number')
      }
    }
  }
  
  if (data?.usageLimit !== undefined) {
    if (data.usageLimit === '' || data.usageLimit === null) {
      data.usageLimit = null // Normalize empty inputs
    } else {
      const limit = Number(data.usageLimit)
      if (isNaN(limit) || limit <= 0) {
        throw new Error('usageLimit must be greater than zero')
      }
    }
  }

  // expiresAt must be a future date if provided (only validate if it's being set to a new value)
  if (data?.expiresAt && data.expiresAt !== originalDoc?.expiresAt) {
    const expires = new Date(data.expiresAt)
    if (isNaN(expires.getTime())) {
      throw new Error('expiresAt must be a valid date')
    }
    if (expires <= new Date()) {
      throw new Error('expiresAt must be a future date')
    }
  }

  // Store credit handling
  if (doc?.type === 'store_credit') {
    if (typeof doc?.storeCreditAmount !== 'number') {
      throw new Error('storeCreditAmount is required for store credit coupons')
    }
    // Initialize remainingBalance on create
    if (operation === 'create') {
      data.remainingBalance = doc.storeCreditAmount
    }
  }

  // usageCount should not be manually set on create
  if (operation === 'create' && data?.usageCount && data.usageCount !== 0) {
    data.usageCount = 0
  }

  return data
}
