'use client'

import React, { createContext, Suspense, useContext, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Why this file exists
 * --------------------
 * /shop is cached for 2 days, so the saved copy is built once, without knowing which filters (?category=...)
 * a visitor will arrive with. Next.js's own `useSearchParams()` can't be used to build that saved copy: on a
 * cached page it makes everything around it fall back to an empty placeholder, so the product grid would be
 * missing from the HTML that search engines read.
 *
 * Instead the shop reads the filters from React context:
 *   - while the page is built on the server, and on the very first render in the browser, the context is
 *     empty, so the page is the default, unfiltered shop (full product grid in the HTML);
 *   - <ShopParamsSync> is the ONLY place that calls `useSearchParams()`. It renders nothing, so the placeholder
 *     it falls back to hides nothing, and as soon as the page has loaded it hands the real address-bar filters
 *     to the shop, which then filters exactly as before.
 */
const ShopParamsContext = createContext<string>('')

export const ShopParamsProvider = ShopParamsContext.Provider

/** The filters from the address bar as URLSearchParams. Empty on the server and on the first render. */
export function useShopParams(): URLSearchParams {
  const query = useContext(ShopParamsContext)
  // Same query string = same object, so effects that depend on it only run when the filters really change.
  return useMemo(() => new URLSearchParams(query), [query])
}

function ParamsReader({ onChange }: { onChange: (query: string) => void }) {
  const query = useSearchParams().toString()
  useEffect(() => {
    onChange(query)
  }, [query, onChange])
  return null
}

/** Reads the address-bar filters and passes them to `onChange`. Renders nothing. */
export function ShopParamsSync({ onChange }: { onChange: (query: string) => void }) {
  return (
    <Suspense fallback={null}>
      <ParamsReader onChange={onChange} />
    </Suspense>
  )
}
