'use client'

import { useMemo, useState } from 'react'
import BuyNowButton from '@/components/BuyNowButton'
import VariantSelector from './variant-selector'
import { useCart } from '@/src/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InventoryInfo {
  available?: number | null
}

interface VariantOption {
  id: string
  price: number
  format?: string | null
  inventory?: InventoryInfo | InventoryInfo[] | null
}

interface ProductMeta {
  title: string
  artist: string
  image: string
  format?: string | null
}

interface Props {
  variants: VariantOption[]
  initialPrice: number
  productMeta: ProductMeta
}

function normalizeInventory(entry: InventoryInfo | InventoryInfo[] | null | undefined) {
  if (Array.isArray(entry)) return entry[0] ?? null
  return entry ?? null
}

export default function VariantClientBlock({ variants, initialPrice, productMeta }: Props) {
  const [selected, setSelected] = useState<VariantOption | null>(variants[0] ?? null)
  const { addItem } = useCart()

  const { price, available, canBuy } = useMemo(() => {
    const current = selected ?? variants[0] ?? null
    const normalizedInventory = normalizeInventory(current?.inventory)
    const stock = normalizedInventory?.available ?? 0
    const resolvedPrice = current?.price ?? initialPrice
    return {
      price: Number(resolvedPrice ?? 0),
      available: Number.isFinite(stock) ? Number(stock) : 0,
      canBuy: Boolean(current && stock && stock > 0),
    }
  }, [selected, variants, initialPrice])

  const handleVariantChange = (variant: unknown) => {
    setSelected((variant as VariantOption) ?? null)
  }

  const handleAddToCart = () => {
    if (!canBuy || !selected) return
    addItem({
      id: selected.id,
      title: productMeta.title || 'Item',
      artist: productMeta.artist || '',
      format: selected.format || productMeta.format || 'vinyl',
      price: price,
      image: productMeta.image,
      variantId: selected.id,
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <VariantSelector variants={variants as any} onChange={handleVariantChange} initialVariantId={variants[0]?.id} />
        <div className="space-y-1">
          <p className="text-2xl font-bold text-accent">${price.toFixed(2)} AUD</p>
          <p className={cn('text-sm', available > 0 ? 'text-emerald-400' : 'text-muted-foreground')}>
            {available > 0 ? `In stock (${available} available)` : 'Out of stock'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <BuyNowButton variantId={selected?.id} quantity={1} />
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={!canBuy}
          onClick={handleAddToCart}
        >
          Add to cart
        </Button>
        {!canBuy ? (
          <p className="text-xs text-muted-foreground">Select a variant to enable cart actions.</p>
        ) : null}
      </div>
    </div>
  )
}
