/**
 * Where to send someone after they log in / register: only a path on THIS website (e.g. "/checkout").
 * Anything that could point to another site ("https://...", "//host", backslashes, "javascript:") is ignored,
 * so a crafted login link can never bounce a customer to a look-alike site.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (!value || value.length > 200) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(value)) return null
  // never loop back into the sign-in pages
  if (/^\/(login|register|forgot-password|reset-password)(\/|\?|#|$)/.test(value)) return null
  return value
}

/** Reads `?next=/checkout` (or the older `?callbackUrl=`) from a query string such as window.location.search. */
export function nextPathFromSearch(search: string): string | null {
  const params = new URLSearchParams(search)
  return safeNextPath(params.get('next') || params.get('callbackUrl'))
}

/** "/login" -> "/login?next=%2Fcheckout" (unchanged when there is nowhere to return to). */
export function withNext(path: string, next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path
}
