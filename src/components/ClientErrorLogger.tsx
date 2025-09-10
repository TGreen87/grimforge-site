'use client'

import { useEffect } from 'react'

export default function ClientErrorLogger() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const payload = {
        message: event.message,
        stack: event.error?.stack,
        context: { source: 'error', filename: event.filename, lineno: event.lineno, colno: event.colno },
        level: 'error',
        url: window.location.href,
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

