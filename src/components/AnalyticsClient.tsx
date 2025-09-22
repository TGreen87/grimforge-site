'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

const SESSION_STORAGE_KEY = 'or-analytics-session'

function resolveSessionId() {
  if (typeof window === 'undefined') return null
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (existing) return existing
    const fresh = uuidv4()
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, fresh)
    return fresh
  } catch {
    return uuidv4()
  }
}

function sendEvent(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload)
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([json], { type: 'application/json' })
    const ok = navigator.sendBeacon('/api/analytics/ingest', blob)
    if (ok) return
  }

  fetch('/api/analytics/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: json,
    keepalive: true,
  }).catch(() => {
    // Swallow send failures; analytics should never block UX.
  })
}

export default function AnalyticsClient() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPathRef = useRef<string>('')
  const sessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!sessionRef.current) {
      sessionRef.current = resolveSessionId()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return
    const search = searchParams?.toString() ?? ''
    const key = `${pathname}?${search}`
    if (key === lastPathRef.current) return
    lastPathRef.current = key

    const payload = {
      eventType: 'page_view',
      pathname,
      search: search || null,
      referrer: (typeof document !== 'undefined' ? document.referrer : null) || null,
      sessionId: sessionRef.current,
      metadata: {
        title: typeof document !== 'undefined' ? document.title : undefined,
      },
    }

    sendEvent(payload)
  }, [pathname, searchParams])

  return null
}
