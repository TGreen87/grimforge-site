'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useCart, type CartItem } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getSupabaseBrowserClient } from '@/integrations/supabase/browser'

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function getItemKey(item: CartItem) {
  return item.variantId ?? item.productId
}

async function resolveVariantIds(items: CartItem[]) {
  const missing = items.filter((item) => !item.variantId)
  if (!missing.length) return items

  const client = getSupabaseBrowserClient()
  const productIds = Array.from(new Set(missing.map((item) => item.productId)))
  if (!productIds.length) return items

  const { data, error } = await client
    .from('variants')
    .select('id, product_id')
    .in('product_id', productIds)
    .eq('active', true)

  if (error) throw error

  const lookup = new Map<string, string>()
  data?.forEach((variant) => {
    if (!lookup.has(variant.product_id)) {
      lookup.set(variant.product_id, variant.id)
    }
  })

  return items.map((item) => {
    if (item.variantId) return item
    const resolvedId = lookup.get(item.productId)
    if (!resolvedId) {
      throw new Error(`Select a format for ${item.title} before checking out.`)
    }
    return { ...item, variantId: resolvedId }
  })
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCart()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = getTotalPrice()
  const disabled = submitting || !items.length

  const cartItems = useMemo(() => items, [items])

  const handleCheckout = async () => {
    if (!items.length || !email) return
    setSubmitting(true)
    setError(null)

    try {
      const resolvedItems = await resolveVariantIds(cartItems)
      const payload = {
        email,
        items: resolvedItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to start Stripe checkout right now.')
      }

      if (typeof window !== 'undefined') {
        window.location.href = data.checkoutUrl as string
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto border-border bg-card/60">
          <CardHeader>
            <CardTitle className="gothic-heading text-2xl">Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>Add a release from the catalog, then return here to complete payment via Stripe Checkout.</p>
            <Button asChild>
              <Link href="/">Return to catalog</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="space-y-4">
          {cartItems.map((item) => {
            const key = getItemKey(item)
            return (
              <Card key={key} className="border-border bg-card/60">
                <CardContent className="flex flex-col sm:flex-row gap-4 p-4">
                  <img src={item.image} alt={item.title} className="w-28 h-28 rounded object-cover border border-border" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="gothic-heading text-lg text-bone">{item.title}</p>
                      {!item.variantId && (
                        <p className="text-xs text-amber-400">Select a format on the product page for faster checkout.</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>Price: {formatPrice(item.priceCents)}</span>
                      <span>Qty:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-4">
                    <p className="text-lg font-semibold text-accent">{formatPrice(item.priceCents * item.quantity)}</p>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(key)}>
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <aside>
          <Card className="border-border bg-card/70">
            <CardHeader>
              <CardTitle className="gothic-heading text-xl">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="cart-email" className="text-sm text-muted-foreground">
                  Email address
                </label>
                <Input
                  id="cart-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping, tax, and final totals are calculated on Stripe Checkout. You will choose a shipping rate (Standard or Express) on the next step.
              </p>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button
                className="w-full"
                disabled={disabled || !email}
                onClick={handleCheckout}
              >
                {submitting ? 'Redirecting…' : 'Checkout with Stripe'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={submitting}
                onClick={clearCart}
              >
                Clear cart
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
