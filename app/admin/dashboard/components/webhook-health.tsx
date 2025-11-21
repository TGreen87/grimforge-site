'use client'

import { useEffect, useState } from 'react'
import { Callout } from '@/components/ui/callout'

interface WebhookHealthRow {
  id: string
  type: string
  status: string
  created_at: string
}

export function WebhookHealth() {
  const [events, setEvents] = useState<WebhookHealthRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/webhook-events')
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load webhook events')
        return res.json()
      })
      .then((data) => {
        setEvents(Array.isArray(data?.events) ? data.events.slice(0, 5) : [])
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load webhook events'
        setError(message)
      })
  }, [])

  if (error) {
    return <Callout variant="warn" title="Webhook status">
      <p>{error}</p>
    </Callout>
  }

  if (!events.length) {
    return <Callout variant="info" title="Webhook status">
      <p>No recent webhook events recorded.</p>
    </Callout>
  }

  const failures = events.filter((e) => e.status && e.status.startsWith('error'))

  return (
    <Callout variant={failures.length ? 'warn' : 'success'} title="Webhook status">
      {failures.length ? (
        <p>{failures.length} recent webhook error(s). Check Stripe dashboard → Events.</p>
      ) : (
        <p>Latest webhooks succeeded.</p>
      )}
    </Callout>
  )
}
