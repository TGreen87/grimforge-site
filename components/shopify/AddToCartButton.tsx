'use client'

import { forwardRef, useState, useTransition } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { shopifyEnv } from '@/lib/shopify/env'

interface AddToCartButtonProps extends ButtonProps {
  missingEnvLabel?: string
  variantId: string
  quantity?: number
  buyerCountryCode?: string
}

const isShopifyReady = shopifyEnv.isConfigured

export const AddToCartButton = forwardRef<HTMLButtonElement, AddToCartButtonProps>((props, ref) => {
  const {
    children = 'Add to cart',
    missingEnvLabel = 'Shopify checkout coming soon',
    variantId,
    quantity = 1,
    buyerCountryCode,
    disabled,
    ...rest
  } = props

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const resolvedDisabled = disabled ?? !isShopifyReady
  const label = !isShopifyReady ? missingEnvLabel : children

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (resolvedDisabled) return
    event.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      try {
        const response = await fetch('/api/shopify/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variantId,
            quantity,
            buyerCountryCode,
          }),
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          const message = typeof payload?.message === 'string' ? payload.message : 'Unable to add to cart.'
          setError(message)
          return
        }

        setSuccess(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to reach Shopify.'
        setError(message)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button
        ref={ref}
        disabled={resolvedDisabled || isPending}
        aria-disabled={resolvedDisabled || isPending}
        onClick={handleClick}
        {...rest}
      >
        {isPending ? 'Adding…' : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && success ? <p className="text-xs text-emerald-400">Added — checkout is ready.</p> : null}
    </div>
  )
})

AddToCartButton.displayName = 'AddToCartButton'
