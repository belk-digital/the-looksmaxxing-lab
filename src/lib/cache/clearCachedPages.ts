import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

// Next throws these when there is no running site to attach a cache change to, for example a
// seed or import script saving a product through Payload's Local API. Nothing is cached in that
// case, so there is nothing to clear.
const NOT_IN_A_REQUEST = /static generation store missing|outside a request scope/i

function clearNow(label: string, paths: string[]) {
  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (NOT_IN_A_REQUEST.test(message)) return
      console.error(`[${label}] could not clear the cached page ${path}:`, err)
    }
  }
}

/**
 * Throws away the cached copy of each page so its next visit is rebuilt from the database.
 *
 * Call this from a Payload `afterChange` / `afterDelete` hook. Payload runs those hooks BEFORE the
 * database transaction commits, so clearing the cache right there lets a visitor who arrives in that
 * window rebuild the page from the OLD data and keep it for the full cache lifetime. `after()` runs
 * once the save has finished and the response has been sent, so the rebuild always sees the new data.
 *
 * A failure here is logged and never thrown: a cache problem must not make a save fail.
 */
export function clearCachedPages(label: string, paths: Array<string | null | undefined>): void {
  const unique = [...new Set(paths.filter((p): p is string => typeof p === 'string' && p.length > 0))]
  if (unique.length === 0) return

  try {
    after(() => clearNow(label, unique))
  } catch {
    clearNow(label, unique)
  }
}
