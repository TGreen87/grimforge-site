'use client'

import { useMemo, useState } from 'react'
import BuyNowButton from '@/components/BuyNowButton'
import VariantSelector from './variant-selector'
import { useCart } from '@/src/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
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
  const { addItem } = useCart()
  const { toast } = useToast()

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

  const addVariantToCart = (variant: VariantWithInventory) => {
    addItem({
      id: variant.id,
      title: productMeta.title || 'Item',
      artist: productMeta.artist || '',
      format: variant.format || productMeta.format || 'vinyl',
      price,
      image: productMeta.image,
      variantId: variant.id,
    })
  }

  const handleAddToCart = () => {
    if (!canBuy || !selected) return
    addVariantToCart(selected)
    toast({ title: 'Added to cart', description: `${productMeta.title} has been added to your cart.` })
  }

  const handleBuyNow = async ({ variantId }: { variantId: string; quantity: number }) => {
    const current = selected && selected.id === variantId
      ? selected
      : variants.find((variant) => variant.id === variantId) ?? null

    if (!canBuy || !current) {
      throw new Error('Variant no longer available. Refresh and try again.')
    }

    addVariantToCart(current)
    toast({ title: 'Preparing checkout…', description: 'Review shipping details to complete your order.' })

    // Wait for cart state to update before opening modal
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('checkout:open'))
    })
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
        <BuyNowButton variantId={selected?.id} quantity={1} onCheckout={handleBuyNow} />
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
