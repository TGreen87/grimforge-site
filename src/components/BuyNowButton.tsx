'use client'

import { useState } from 'react'

interface BuyNowButtonProps {
  variantId?: string
  quantity?: number
  className?: string
}

export default function BuyNowButton({ variantId, quantity = 1, className }: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false)
  const disabled = !variantId || loading

  const handleClick = async () => {
    if (!variantId) return
    try {
      setLoading(true)
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: variantId, quantity }),
      })

      let data: any = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (!res.ok) {
        const message = typeof data?.error === 'string' && data.error.trim().length > 0
          ? data.error.trim()
          : typeof data?.detail === 'string' && data.detail.trim().length > 0
            ? data.detail.trim()
            : `Checkout failed (status ${res.status})`
        throw new Error(message)
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl as string
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (e) {
      console.error(e)
      const message = e instanceof Error && e.message ? e.message : 'Unable to start checkout. Please try again.'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={className || 'bg-accent text-accent-foreground rounded px-6 py-3 hover:bg-accent/90 transition-colors gothic-heading'}
      disabled={disabled}
      onClick={handleClick}
    >
      {loading ? 'Processing…' : 'Buy Now'}
    </button>
  )
}
