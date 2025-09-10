'use client'

import { useEffect } from 'react'

function getOrCreateCid(): string {
  try {
    const fromCookie = document.cookie.split('; ').find((c) => c.startsWith('orr_cid='))?.split('=')[1]
    if (fromCookie) return fromCookie
    const cid = (self.crypto && 'randomUUID' in self.crypto ? (self.crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
    document.cookie = `orr_cid=${cid}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax` + (location.protocol === 'https:' ? '; Secure' : '')
    return cid
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export default function ClientErrorLogger() {
  useEffect(() => {
    const cid = getOrCreateCid()
    const handler = (event: ErrorEvent) => {
      const payload = {
        message: event.message,
        stack: event.error?.stack,
        context: { source: 'error', filename: event.filename, lineno: event.lineno, colno: event.colno },
        level: 'error',
        url: window.location.href,
        cid,
      }
      navigator.sendBeacon('/api/client-logs', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    }
    const rejHandler = (event: PromiseRejectionEvent) => {
      const payload = {
        message: (event.reason && (event.reason.message || String(event.reason))) || 'Unhandled rejection',
        stack: event.reason?.stack,
        context: { source: 'unhandledrejection' },
        level: 'error',
        url: window.location.href,
        cid,
      }
      navigator.sendBeacon('/api/client-logs', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    }
    window.addEventListener('error', handler)
    window.addEventListener('unhandledrejection', rejHandler)
    return () => {
      window.removeEventListener('error', handler)
      window.removeEventListener('unhandledrejection', rejHandler)
    }
  }, [])

  return null
}
