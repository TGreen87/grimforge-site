'use client'

import { forwardRef } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { shopifyEnv } from '@/lib/shopify/env'

interface AddToCartButtonProps extends ButtonProps {
  missingEnvLabel?: string
}

const isShopifyReady = shopifyEnv.isConfigured

export const AddToCartButton = forwardRef<HTMLButtonElement, AddToCartButtonProps>((props, ref) => {
  const {
    children = 'Add to cart',
    missingEnvLabel = 'Shopify checkout coming soon',
    disabled,
    ...rest
  } = props

  const resolvedDisabled = disabled ?? !isShopifyReady
  const label = !isShopifyReady ? missingEnvLabel : children

  return (
    <Button
      ref={ref}
      disabled={resolvedDisabled}
      aria-disabled={resolvedDisabled}
      {...rest}
    >
      {label}
    </Button>
  )
})

AddToCartButton.displayName = 'AddToCartButton'

