'use client'

import { useMemo, useState } from 'react'
import VariantSelector from './variant-selector'
import { cn } from '@/lib/utils'
import type { VariantWithInventory } from './metadata'

interface ProductMeta {
  title: string
  artist: string
  image: string
  format?: string | null
}

interface Props {
  variants: VariantWithInventory[]
  initialPrice: number
  productMeta: ProductMeta
}

export default function VariantClientBlock({ variants, initialPrice, productMeta }: Props) {
  const [selected, setSelected] = useState<VariantWithInventory | null>(variants[0] ?? null)

  const { price, available, canBuy } = useMemo(() => {
    const current = selected ?? variants[0] ?? null
    const stock = current?.inventory?.available ?? 0
    const resolvedPrice = current?.price ?? initialPrice
    return {
      price: Number(resolvedPrice ?? 0),
      available: Number.isFinite(stock) ? Number(stock) : 0,
      canBuy: Boolean(current && stock && stock > 0),
    }
  }, [selected, variants, initialPrice])

  const handleVariantChange = (variant: VariantWithInventory | null) => {
    setSelected(variant)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <VariantSelector variants={variants} onChange={handleVariantChange} initialVariantId={variants[0]?.id} />
        <div className="space-y-1">
          <p className="text-2xl font-bold text-accent">${price.toFixed(2)} AUD</p>
          <p className={cn('text-sm', available > 0 ? 'text-emerald-400' : 'text-muted-foreground')}>
            {available > 0 ? `In stock (${available} available)` : 'Out of stock'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Shopify-powered checkout is launching soon. Select your preferred variant now and we&apos;ll notify you when purchases go live.
        </p>
        {!canBuy ? (
          <p className="text-xs text-muted-foreground">Select a variant to check its availability.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Available stock updates will carry across to the Shopify storefront.</p>
        )}
      </div>
    </div>
  )
}
