import { NextRequest, NextResponse } from 'next/server'
import { quoteAusPostRates, type ShippingItem, type ShippingDestination } from '@/src/services/shipping/auspost'
import { STRIPE_CONFIG } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

type QuoteRequest = {
  destination: ShippingDestination
  items: ShippingItem[]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuoteRequest | undefined
    if (!body || !body.destination || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const originPostcode = process.env.AUSPOST_ORIGIN_POSTCODE || ''
    const hasAusPost = Boolean(process.env.AUSPOST_API_KEY && originPostcode)

    if (!hasAusPost) {
      // Degrade to Stripe static options as a safe fallback
      return NextResponse.json({
        configured: false,
        options: STRIPE_CONFIG.shippingOptions.map((o) => ({
          provider: 'stripe_static',
          shipping_rate_data: o.shipping_rate_data,
        })),
      })
    }

    const auspostOptions = await quoteAusPostRates({
      originPostcode,
      destination: body.destination,
      items: body.items,
    })

    return NextResponse.json({
      configured: true,
      options: auspostOptions,
    })
  } catch (error) {
    console.error('Shipping quote error:', error)
    // On error, don’t block checkout — provide fallback Stripe options
    return NextResponse.json({
      configured: false,
      options: STRIPE_CONFIG.shippingOptions.map((o) => ({
        provider: 'stripe_static',
        shipping_rate_data: o.shipping_rate_data,
      })),
    })
  }
}

