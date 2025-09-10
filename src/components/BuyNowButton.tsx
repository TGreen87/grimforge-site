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
      if (!res.ok) throw new Error('Checkout failed')
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl as string
      }
    } catch (e) {
      console.error(e)
      alert('Unable to start checkout. Please try again.')
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

