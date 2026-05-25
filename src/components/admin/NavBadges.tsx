'use client'

import { useEffect } from 'react'

export default function NavBadges() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) return
        const data = await res.json()

        updateBadge('/collections/orders', data.orders, '#ef4444', 'Pending') // Red for Orders
        updateBadge('/collections/affiliate-applications', data.affiliates, '#eab308', 'Pending', 'dark') // Yellow for Affiliates
        updateBadge('/collections/reviews', data.reviews, '#3b82f6', 'Pending') // Blue for Reviews
      } catch (err) {
        console.error('Failed to fetch nav badges', err)
      }
    }

    const updateBadge = (hrefSuffix: string, count: number, bgColor: string, label: string = 'New', textColor: string = '#ffffff') => {
      // Find the nav link that ends with the collection path
      const link = document.querySelector(`a[href$="${hrefSuffix}"]`) as HTMLAnchorElement
      if (!link) return

      // Payload nav links usually contain a label span, we want to append to the link
      let badge = link.querySelector('.custom-nav-badge') as HTMLSpanElement

      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span')
          badge.className = 'custom-nav-badge'
          badge.style.display = 'inline-flex'
          badge.style.alignItems = 'center'
          badge.style.justifyContent = 'center'
          badge.style.marginLeft = 'auto'
          badge.style.padding = '2px 6px'
          badge.style.borderRadius = '9999px'
          badge.style.fontSize = '0.7rem'
          badge.style.fontWeight = 'bold'
          badge.style.lineHeight = '1'
          badge.style.backgroundColor = bgColor
          badge.style.color = textColor === 'dark' ? '#111827' : '#ffffff'
          badge.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.1)'
          
          // Ensure the link is a flex container so we can push the badge to the right
          link.style.display = 'flex'
          link.style.alignItems = 'center'
          
          link.appendChild(badge)
        }
        badge.innerText = `${count} ${label}`
      } else if (badge) {
        badge.remove()
      }
    }

    // Initial fetch
    fetchNotifications()

    // Poll every 30 seconds
    intervalId = setInterval(fetchNotifications, 30000)

    return () => clearInterval(intervalId)
  }, [])

  return null
}
