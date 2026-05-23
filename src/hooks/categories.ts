// src/hooks/categories.ts
import type { BeforeChangeHook } from 'payload/types'
import slugify from 'slugify'

/**
 * Auto‑generate a slug from the English (`en`) version of the `name` field.
 * If a slug already exists (manual override), keep it.
 */
export const beforeChangeGenerateSlug: BeforeChangeHook = async ({ data, originalDoc }) => {
  if (data.slug) return data // respect manual slug
  const nameEn = (data.name?.en as string) ?? (originalDoc?.name?.en as string)
  if (nameEn) {
    data.slug = slugify(nameEn, { lower: true, strict: true })
  }
  return data
}
