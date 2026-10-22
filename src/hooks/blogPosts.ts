import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { clearCachedPages } from '../lib/cache/clearCachedPages'

// The journal list page shows every post, so it is cleared along with the post's own page.
function postPages(...slugs: Array<string | null | undefined>): string[] {
  return [...slugs.filter(Boolean).map((slug) => `/journal/${slug}`), '/journal']
}

// Saving a blog post in the admin clears the cached copy of that post's page right away.
// If the slug was changed, the old address is cleared too.
export const blogPostsAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  clearCachedPages('blogPostsAfterChange', postPages(doc?.slug, previousDoc?.slug))
}

export const blogPostsAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  clearCachedPages('blogPostsAfterDelete', postPages(doc?.slug))
}
