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
    const crumbs: Array<{ t: number; type: string; data: string }> = []
    const addCrumb = (type: string, data: unknown) => {
      try {
        const str = typeof data === 'string' ? data : JSON.stringify(data)
        crumbs.push({ t: Date.now(), type, data: (str || '').slice(0, 400) })
        if (crumbs.length > 20) crumbs.shift()
      } catch {
        // ignore
      }
    }

    // Wrap console methods
    const original = { log: console.log, warn: console.warn, error: console.error }
    console.log = (...args: any[]) => { addCrumb('log', args.join(' ')); original.log.apply(console, args) }
    console.warn = (...args: any[]) => { addCrumb('warn', args.join(' ')); original.warn.apply(console, args) }
    console.error = (...args: any[]) => { addCrumb('error', args.join(' ')); original.error.apply(console, args) }

    const navHandler = () => addCrumb('nav', location.href)
    window.addEventListener('hashchange', navHandler)
    window.addEventListener('popstate', navHandler)
    const handler = (event: ErrorEvent) => {
      const payload = {
        message: event.message,
        stack: event.error?.stack,
        context: { source: 'error', filename: event.filename, lineno: event.lineno, colno: event.colno, breadcrumbs: crumbs.slice() },
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
        context: { source: 'unhandledrejection', breadcrumbs: crumbs.slice() },
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
      window.removeEventListener('hashchange', navHandler)
      window.removeEventListener('popstate', navHandler)
      console.log = original.log
      console.warn = original.warn
      console.error = original.error
    }
  }, [])

  return null
}
