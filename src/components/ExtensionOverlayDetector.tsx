'use client'

import { useEffect, useState } from 'react'

const OVERLAY_SELECTORS = ['[class*="overlay_bundle"]', '[id*="overlay_bundle"]'] as const
const CUSTOM_ELEMENT_NAMES = [
  'overlay-bundle-root',
  'overlay-bundle',
  'overlay-app',
  'browser-extension-overlay',
  'arc-overlay-root',
  'crx-overlay-root',
] as const

function probeForExtensions() {
  try {
    const suspiciousNode = OVERLAY_SELECTORS.some((selector) => document.querySelector(selector))
    if (suspiciousNode) return true

    if (typeof window !== 'undefined' && window.customElements && typeof window.customElements.get === 'function') {
      return CUSTOM_ELEMENT_NAMES.some((name) => {
        try {
          return Boolean(window.customElements.get(name))
        } catch {
          return false
        }
      })
    }
  } catch (error) {
    console.warn('extension detector: failed during probe', error)
  }
  return false
}

export default function ExtensionOverlayDetector() {
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const applyDetection = () => {
      const hasOverlay = probeForExtensions()
      if (hasOverlay) {
        document.documentElement.setAttribute('data-ext-overlay', '1')
        setDetected(true)
      }
    }

    applyDetection()

    let cleanup: (() => void) | undefined
    if (typeof requestAnimationFrame === 'function') {
      const id = requestAnimationFrame(applyDetection)
      cleanup = () => cancelAnimationFrame(id)
    } else if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
      const timeoutId = window.setTimeout(applyDetection, 0)
      cleanup = () => window.clearTimeout(timeoutId)
    }

    return () => {
      cleanup?.()
    }
  }, [])

  if (!detected) return null

  return (
    <span className="sr-only" role="status" aria-live="polite">
      Browser extension overlay detected. Screen interactions may be altered.
    </span>
  )
}
