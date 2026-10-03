import type { CollectionAfterChangeHook } from 'payload'
import { revalidatePath } from 'next/cache'

export const blogPostsAfterChange: CollectionAfterChangeHook = async ({ doc }) => {
  try {
    if (doc.slug) {
      revalidatePath(`/journal/${doc.slug}`)
      revalidatePath('/journal')
    }
  } catch (err) {
    console.error('[blogPostsAfterChange] revalidation failed:', err)
  }
}
