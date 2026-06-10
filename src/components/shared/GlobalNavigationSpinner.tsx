'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function GlobalNavigationSpinner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Clear all navigating states when the route finishes changing
  useEffect(() => {
    document.querySelectorAll('.is-navigating').forEach(el => {
      el.classList.remove('is-navigating')
    })
  }, [pathname, searchParams])

  // Attach a global click listener to intercept navigation attempts
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find the closest anchor tag that was clicked
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (!href) return

      // Ignore external links, mailto, tel, anchors, and new tabs
      if (
        href.startsWith('http') || 
        href.startsWith('mailto:') || 
        href.startsWith('tel:') || 
        href.startsWith('#') || 
        target.getAttribute('target') === '_blank'
      ) {
        return
      }

      // If the link is just pointing to the exact same page, no navigation will occur
      const currentUrl = window.location.pathname + window.location.search
      if (href === currentUrl) return

      // Add the navigating class to trigger the spinner overlay
      target.classList.add('is-navigating')

      // Fallback timeout: If the navigation gets stuck or fails, clear the spinner after 5 seconds
      setTimeout(() => {
        target.classList.remove('is-navigating')
      }, 5000)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
