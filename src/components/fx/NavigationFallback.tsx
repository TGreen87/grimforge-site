'use client'

import { useEffect } from 'react'

/**
 * Netlify's current Next.js runtime occasionally swallows client-side Link navigation
 * (click handler calls preventDefault but Router never changes window.location).
 * This shim falls back to a vanilla navigation when that happens so users do not
 * need to right-click → open in new tab.
 */
export default function NavigationFallback() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented === false) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!anchor) return
      const hrefAttr = anchor.getAttribute('href')
      if (!hrefAttr || hrefAttr.startsWith('#')) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('data-native-nav') && anchor.getAttribute('data-native-nav') === 'false') {
        return
      }

      const startUrl = window.location.href
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (window.location.href === startUrl) {
            window.location.assign(url.href)
          }
        }, 180)
      })
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  return null
}
