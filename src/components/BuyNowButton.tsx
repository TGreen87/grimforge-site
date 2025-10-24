'use client'

import { useState } from 'react'

interface BuyNowButtonProps {
  variantId?: string
  quantity?: number
  className?: string
  onCheckout?: (options: { variantId: string; quantity: number }) => Promise<void> | void
}

export default function BuyNowButton({ variantId, quantity = 1, className, onCheckout }: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false)
  const disabled = !variantId || loading

  const handleClick = async () => {
    if (!variantId || !onCheckout) return
    try {
      setLoading(true)
      await onCheckout({ variantId, quantity })
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
