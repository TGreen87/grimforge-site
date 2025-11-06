'use client'

import { forwardRef, useEffect, useState, useTransition } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useShopifyReady } from './useShopifyReady'

declare global {
  interface Window {
    __SHOPIFY_LAST_CHECKOUT__?: string | null
  }
}

interface CheckoutButtonProps extends ButtonProps {
  missingEnvLabel?: string
  emptyCartLabel?: string
}

export const CheckoutButton = forwardRef<HTMLButtonElement, CheckoutButtonProps>((props, ref) => {
  const {
    children = 'Go to checkout',
    missingEnvLabel = 'Checkout unavailable',
    emptyCartLabel = 'Cart is empty',
    disabled,
    ...rest
  } = props

  const isReady = useShopifyReady()
  const [locked, setLocked] = useState<boolean>(() => !isReady)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (isReady) {
      setLocked(false)
    } else {
      setLocked(true)
    }
  }, [isReady])

  const resolvedDisabled = disabled ?? locked || !isReady || isPending
  const label = !isReady ? missingEnvLabel : locked && !error ? emptyCartLabel : children

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (resolvedDisabled) return
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch('/api/shopify/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })

        const payload = await response.json().catch(() => ({}))

        if (response.status === 404) {
          setLocked(true)
          setError(typeof payload?.message === 'string' ? payload.message : 'Cart is empty.')
          return
        }

        if (!response.ok) {
          const message = typeof payload?.message === 'string' ? payload.message : 'Unable to reach checkout.'
          setError(message)
          return
        }

        const checkoutUrl = typeof payload?.checkoutUrl === 'string' ? payload.checkoutUrl : null
        if (!checkoutUrl) {
          setError('Checkout URL missing from response.')
          return
        }

        if (typeof window !== 'undefined') {
          window.__SHOPIFY_LAST_CHECKOUT__ = checkoutUrl
          window.location.assign(checkoutUrl)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to reach checkout.'
        setError(message)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button
        ref={ref}
        disabled={resolvedDisabled}
        aria-disabled={resolvedDisabled}
        onClick={handleClick}
        {...rest}
      >
        {isPending ? 'Redirecting…' : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
})

CheckoutButton.displayName = 'CheckoutButton'

